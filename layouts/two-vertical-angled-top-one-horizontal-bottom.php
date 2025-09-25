<?php
$panel1Clip = uniqid('two-vertical-angled-top-one-horizontal-bottom-panel1-');
$panel2Clip = uniqid('two-vertical-angled-top-one-horizontal-bottom-panel2-');
?>
<div class="layout two-vertical-angled-top-one-horizontal-bottom">
    <div class="panel panel1" data-slot="1" data-clip-polygon="polygon(0 0, 100 0, 94 100, 0 100)">
        <svg class="panel-mask" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <clipPath id="<?= htmlspecialchars($panel1Clip, ENT_QUOTES, 'UTF-8') ?>">
                    <polygon points="0 0, 100 0, 94 100, 0 100"></polygon>
                </clipPath>
            </defs>
            <foreignObject x="0" y="0" width="100" height="100" clip-path="url(#<?= htmlspecialchars($panel1Clip, ENT_QUOTES, 'UTF-8') ?>)">
                <div xmlns="http://www.w3.org/1999/xhtml" class="panel-inner"></div>
            </foreignObject>
        </svg>
    </div>
    <div class="panel panel2" data-slot="2" data-clip-polygon="polygon(6 0, 100 0, 100 100, 0 100)">
        <svg class="panel-mask" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <clipPath id="<?= htmlspecialchars($panel2Clip, ENT_QUOTES, 'UTF-8') ?>">
                    <polygon points="6 0, 100 0, 100 100, 0 100"></polygon>
                </clipPath>
            </defs>
            <foreignObject x="0" y="0" width="100" height="100" clip-path="url(#<?= htmlspecialchars($panel2Clip, ENT_QUOTES, 'UTF-8') ?>)">
                <div xmlns="http://www.w3.org/1999/xhtml" class="panel-inner"></div>
            </foreignObject>
        </svg>
    </div>
    <div class="panel panel3" data-slot="3">
        <div class="panel-inner"></div>
    </div>
</div>
