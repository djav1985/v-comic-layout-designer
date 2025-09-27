export const getSocialIconSvg = (platform: string, color: string, shape: "circle" | "square" | "ghost") => {
  const size = 16; // Uniform icon size for email compatibility
  const bgColor = shape === "ghost" ? "transparent" : color;
  const iconColor = shape === "ghost" ? color : "#ffffff"; // Ghost: brand-colored stroke; Filled: white icon
  const borderRadius = shape === "circle" ? "50%" : (shape === "square" ? "0" : "0");
  const padding = shape === "ghost" ? "0" : "4px"; // Padding for background shapes

  // Keep icons flat/minimal, consistent paths and stroke weights
  const svgFill = shape === "ghost" ? "none" : iconColor;
  const svgStroke = shape === "ghost" ? iconColor : "none";
  const svgStrokeWidth = shape === "ghost" ? "2" : "0";

  let iconContent = '';

  switch (platform) {
    case "LinkedIn":
      iconContent = `<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><rect width="4" height="12" x="2" y="9" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><circle cx="4" cy="4" r="2" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`;
      break;
    case "X":
      iconContent = `<path d="M18.244 2.25h3.308l-7.227 8.26 8.758 11.24H15.305L8.995 13.95 1.956 22H.654l7.73-9.94L.043 2.25h8.04L12.32 8.414 18.244 2.25zM17.292 19.75H19.15L7.31 4.25H5.362L17.292 19.75z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`;
      break;
    case "Facebook":
      iconContent = `<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`;
      break;
    case "Instagram":
      iconContent = `<path d="M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.92.333 4.146.636 3.373.94 2.75 1.394 2.193 1.951.81 3.33.072 5.06.072 7.053c-.014 1.28-.072 1.688-.072 4.947 0 3.259.014 3.667.072 4.947.06 1.937.804 3.673 2.187 5.058 1.377 1.377 3.113 2.12 5.058 2.187 1.28.058 1.688.072 4.947.072 3.259 0 3.667-.014 4.947-.072 1.937-.06 3.673-.804 5.058-2.187 1.377-1.377 2.12-3.113 2.187-5.058.058-1.28.072-1.688.072-4.947 0-3.259-.014-3.667-.072-4.947-.06-1.937-.804-3.673-2.187-5.058C20.667.333 19.812.132 18.534.072 17.254.014 16.847 0 12 0zm0 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.07 4.85-1.48 3.228-1.691 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.85-.07-3.228-1.48-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.849 0-3.204.012-3.584.07-4.85 1.48-3.228 1.691-4.771 4.919-4.919 1.266-.058 1.644-.069 4.85-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm6.406-6.007c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.645-1.44-1.44-1.44z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`;
      break;
    case "YouTube":
      iconContent = `<path d="M18.7 3.3H5.3C3.4 3.3 2 4.7 2 6.6v10.8c0 1.9 1.4 3.3 3.3 3.3h13.4c1.9 0 3.3-1.4 3.3-3.3V6.6c0-1.9-1.4-3.3-3.3-3.3zM9.7 15.5V8.5l6 3.5-6 3.5z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`;
      break;
    case "GitHub":
      iconContent = `<path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.165 6.839 9.488.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.109-1.465-1.109-1.465-.908-.619.069-.607.069-.607 1.004.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.089 2.91.833.091-.647.35-1.089.636-1.338-2.22-.253-4.555-1.119-4.555-4.95 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.65 0 0 .84-.27 2.75 1.029A9.47 9.47 0 0 1 12 6.844c.85.004 1.701.114 2.503.332 1.909-1.299 2.747-1.029 2.747-1.029.546 1.38.203 2.398.098 2.65.64.698 1.029 1.591 1.029 2.682 0 3.839-2.339 4.69-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.579.688.482C21.135 20.165 24 16.419 24 12c0-5.523-4.477-10-10-10z" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`;
      break;
    case "Website":
      iconContent = `<circle cx="12" cy="12" r="10" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" fill="none" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><path d="M2 12h20" fill="none" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`;
      break;
    default:
      // Generic minimal share icon
      iconContent = `<circle cx="18" cy="5" r="3" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><circle cx="6" cy="12" r="3" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><circle cx="18" cy="19" r="3" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}"/>`;
      break;
  }

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
      ${iconContent}
    </svg>
  `;

  const base64Svg = `data:image/svg+xml;base64,${btoa(svgString)}`;

  return `
    <span style="display: inline-block; background-color: ${bgColor}; border: none; border-radius: ${borderRadius}; padding: ${padding}; line-height: 0;">
      <img src="${base64Svg}" alt="${platform} icon" width="${size}" height="${size}" style="display: block; max-width: ${size}px; height: auto;" />
    </span>
  `;
};