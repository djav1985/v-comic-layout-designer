<?php
$panel2Clip = uniqid('one-horizontal-top-two-vertical-angled-bottom-panel2-');
$panel3Clip = uniqid('one-horizontal-top-two-vertical-angled-bottom-panel3-');
?>
<div class="layout one-horizontal-top-two-vertical-angled-bottom">
    <div class="panel panel1" data-slot="1">
        <div class="panel-inner"></div>
    </div>
    <div class="panel panel2" data-slot="2" data-clip-polygon="polygon(0% 0%, 100% 0%, 94% 100%, 0% 100%)">
        <svg class="panel-mask" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <clipPath id="<?= htmlspecialchars($panel2Clip, ENT_QUOTES, 'UTF-8') ?>">
                    <polygon points="0 0, 100 0, 94 100, 0 100"></polygon>
                </clipPath>
            </defs>
            <foreignObject x="0" y="0" width="100" height="100" clip-path="url(#<?= htmlspecialchars($panel2Clip, ENT_QUOTES, 'UTF-8') ?>)">
                <div xmlns="http://www.w3.org/1999/xhtml" class="panel-inner"></div>
            </foreignObject>
        </svg>
    </div>
    <div class="panel panel3" data-slot="3" data-clip-polygon="polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)">
        <svg class="panel-mask" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <clipPath id="<?= htmlspecialchars($panel3Clip, ENT_QUOTES, 'UTF-8') ?>">
                    <polygon points="6 0, 100 0, 100 100, 0 100"></polygon>
                </clipPath>
            </defs>
            <foreignObject x="0" y="0" width="100" height="100" clip-path="url(#<?= htmlspecialchars($panel3Clip, ENT_QUOTES, 'UTF-8') ?>)">
                <div xmlns="http://www.w3.org/1999/xhtml" class="panel-inner"></div>
            </foreignObject>
        </svg>
    </div>
</div>
