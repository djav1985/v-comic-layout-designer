import { showSaveIndicator } from "./save-indicator.js";

const dom = {
  imageList: null,
  imagesSection: null,
  mobileImageToggle: null,
  mobileImageBackdrop: null,
  mobileModalClose: null,
  uploadForm: null,
  imageInput: null,
};

let selectedImageName = null;
let selectedImageWrapper = null;

export function isMobileViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

export function openImageLibrary() {
  if (!dom.imagesSection) return;
  dom.imagesSection.classList.add("is-open");
  document.body.classList.add("image-library-open");
  if (dom.mobileImageToggle) {
    dom.mobileImageToggle.setAttribute("aria-expanded", "true");
  }
  if (dom.mobileImageBackdrop) {
    dom.mobileImageBackdrop.hidden = false;
  }
}

export function closeImageLibrary() {
  if (!dom.imagesSection) return;
  dom.imagesSection.classList.remove("is-open");
  document.body.classList.remove("image-library-open");
  if (dom.mobileImageToggle) {
    dom.mobileImageToggle.setAttribute("aria-expanded", "false");
  }
  if (dom.mobileImageBackdrop) {
    dom.mobileImageBackdrop.hidden = true;
  }
}

export function clearSelectedImage() {
  if (selectedImageWrapper && selectedImageWrapper.classList) {
    selectedImageWrapper.classList.remove("selected");
  }
  selectedImageName = null;
  selectedImageWrapper = null;
}

function selectImage(name, wrapper) {
  if (!name || !wrapper) return;
  if (selectedImageWrapper && selectedImageWrapper !== wrapper) {
    selectedImageWrapper.classList.remove("selected");
  }
  selectedImageName = name;
  selectedImageWrapper = wrapper;
  wrapper.classList.add("selected");
  if (isMobileViewport()) {
    closeImageLibrary();
  }
}

export function getSelectedImageName() {
  return selectedImageName;
}

export function setInitialImages(list) {
  if (typeof initialImages === "undefined") {
    return;
  }
  
  if (!Array.isArray(initialImages)) {
    return;
  }

  initialImages.length = 0;
  if (Array.isArray(list)) {
    initialImages.push(...list);
  }
}

export function uploadImages(files) {
  if (!files || !files.length) {
    return Promise.resolve();
  }

  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("images[]", file);
  });

  return fetch("/upload", { method: "POST", body: formData }).then((response) =>
    response
      .json()
      .catch(() => ({ error: "Upload failed" }))
      .then((data) => {
        if (!response.ok || (data && data.error)) {
          const message = data && data.error ? data.error : "Upload failed";
          throw new Error(message);
        }

        if (Array.isArray(data)) {
          setInitialImages(data);
          updateImages(data);
          showSaveIndicator("Images uploaded ✓", "#4CAF50");
        }

        return data;
      }),
  );
}

function createImagePlaceholder() {
  const placeholder = document.createElement("div");
  placeholder.className = "empty-state";
  placeholder.dataset.placeholder = "";
  placeholder.innerHTML = `
    <span class="icon" aria-hidden="true">🖼️</span>
    <p>Drop panels into your story by uploading artwork.</p>
  `;
  return placeholder;
}

function getAssignedImages(pages) {
  const assigned = new Set();

  document.querySelectorAll("#pages .panel img").forEach((img) => {
    if (img.dataset.name) {
      assigned.add(img.dataset.name);
    }
  });

  if (Array.isArray(pages)) {
    pages.forEach((page) => {
      if (page.slots) {
        Object.values(page.slots).forEach((imgName) => {
          if (imgName) assigned.add(imgName);
        });
      }
    });
  }

  return assigned;
}

function getCurrentPageState() {
  const pages = [];
  document.querySelectorAll("#pages > .page").forEach((pageDiv) => {
    const slots = {};
    pageDiv.querySelectorAll(".panel").forEach((panel) => {
      const slot = String(panel.getAttribute("data-slot"));
      const img = panel.querySelector("img");
      if (img && img.dataset.name) {
        slots[slot] = img.dataset.name;
      }
    });
    pages.push({ slots });
  });
  return pages;
}

export function updateImages(list, pages = null) {
  const { imageList } = dom;
  if (!imageList) return;

  const currentPages = pages || getCurrentPageState();
  const assigned = getAssignedImages(currentPages);

  imageList.innerHTML = "";

  let appended = 0;
  list.forEach((name) => {
    if (!assigned.has(name)) {
      const wrapper = document.createElement("div");
      wrapper.className = "image-wrapper";
      wrapper.dataset.name = name;
      const img = document.createElement("img");
      img.src = `/uploads/${name}`;
      img.className = "thumb";
      img.draggable = true;
      img.dataset.name = name;

      if (selectedImageName === name) {
        wrapper.classList.add("selected");
        selectedImageWrapper = wrapper;
      }

      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");
      img.addEventListener("click", () => {
        selectImage(name, wrapper);
      });
      img.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectImage(name, wrapper);
        }
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete-image-btn";
      delBtn.innerHTML = '<span aria-hidden="true">✕</span> Remove';
      delBtn.setAttribute("aria-label", "Delete image");
      delBtn.addEventListener("click", () => {
        fetch("/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `name=${encodeURIComponent(name)}`,
        })
          .then((r) => r.json())
          .then(() => {
            wrapper.remove();
            if (!imageList.querySelector(".image-wrapper")) {
              imageList.appendChild(createImagePlaceholder());
            }
            if (selectedImageName === name) {
              clearSelectedImage();
            }
          });
      });
      wrapper.appendChild(img);
      wrapper.appendChild(delBtn);
      imageList.appendChild(wrapper);
      appended += 1;
    }
  });

  if (appended === 0) {
    imageList.appendChild(createImagePlaceholder());
  }

  if (
    selectedImageName &&
    !imageList.querySelector(`.image-wrapper[data-name="${selectedImageName}"]`)
  ) {
    clearSelectedImage();
  }
}

function bindUploadForm() {
  const { uploadForm, imageInput } = dom;
  if (!uploadForm || !imageInput) {
    return;
  }

  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!imageInput.files.length) return;

    uploadImages(imageInput.files)
      .catch((error) => {
        console.error(error);
        showSaveIndicator("Upload failed ✗", "#f44336");
        alert(`Failed to upload images: ${error.message}`);
      })
      .finally(() => {
        imageInput.value = "";
      });
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadForm.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadForm.classList.add("drag-active");
    });
  });

  ["dragleave", "dragend"].forEach((eventName) => {
    uploadForm.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadForm.classList.remove("drag-active");
    });
  });

  uploadForm.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    uploadForm.classList.remove("drag-active");

    const files = event.dataTransfer ? event.dataTransfer.files : null;
    if (files && files.length) {
      uploadImages(files).catch((error) => {
        console.error(error);
        showSaveIndicator("Upload failed ✗", "#f44336");
        alert(`Failed to upload images: ${error.message}`);
      });
    }
  });
}

function bindMobileLibraryEvents() {
  if (dom.mobileImageToggle) {
    dom.mobileImageToggle.addEventListener("click", () => {
      if (dom.imagesSection && dom.imagesSection.classList.contains("is-open")) {
        closeImageLibrary();
      } else {
        openImageLibrary();
      }
    });
  }

  if (dom.mobileModalClose) {
    dom.mobileModalClose.addEventListener("click", () => {
      closeImageLibrary();
    });
  }

  if (dom.mobileImageBackdrop) {
    dom.mobileImageBackdrop.addEventListener("click", () => {
      closeImageLibrary();
    });
  }

  window.addEventListener("resize", () => {
    if (!isMobileViewport()) {
      closeImageLibrary();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeImageLibrary();
    }
  });
}

function bindImageListDragEvents() {
  const { imageList } = dom;
  if (!imageList) return;

  imageList.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("thumb")) {
      e.dataTransfer.setData("text/plain", e.target.dataset.name);
    }
  });
}

export function initializeImageLibrary(refs) {
  Object.assign(dom, refs);
  bindMobileLibraryEvents();
  bindUploadForm();
  bindImageListDragEvents();
}
