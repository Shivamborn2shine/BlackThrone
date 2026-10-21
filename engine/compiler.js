const fs = require('fs');
const path = require('path');

/**
 * ============================================================================
 * BLACKTHRONE ENGINE — MASTER COMPILER
 * Compiles any merchant JSON preset into a production-ready landing page.
 * ============================================================================
 */

function compileMerchant(config, options = {}) {
    const brand = config;
    const theme = config.theme || {};
    const primary = theme.primary || '#4F46E5';
    const primaryHover = theme.primaryHover || '#4338CA';
    const primaryLight = theme.primaryLight || '#EEF2FF';
    const primaryShadow = theme.primaryShadow || 'rgba(79, 70, 229, 0.3)';
    const accent = theme.accent || '#2563EB';
    const accentGlow = theme.accentGlow || 'rgba(37, 99, 235, 0.25)';
    const gradientBg = theme.gradientBg || 'linear-gradient(135deg, #E0E7FF 0%, #EDE9FE 50%, #FCE7F3 100%)';
    const heroGradient = theme.heroGradient || 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #C7D2FE 100%)';

    // 1. Build Feature Tags HTML
    const featureTagsHtml = (brand.featureTags || []).map(t => `
                        <span class="px-2.5 py-1 rounded-full ${t.bg} ${t.textCol} text-[10px] font-bold border ${t.border}">
                            ${t.icon} ${t.text}
                        </span>`).join('');

    // 2. Build Specialities Row HTML
    const specialitiesHtml = (brand.specialities || []).map((s, idx) => `
                        <!-- Item ${idx + 1}: ${s.name} -->
                        <div class="flex-shrink-0 flex flex-col items-center w-20 cursor-pointer group"
                            onclick="quickSelectCategory('${s.category}')">
                            <div class="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr ${s.gradient} shadow-md group-hover:scale-105 transition-all">
                                <img src="${s.image}" alt="${s.name}" class="w-full h-full object-cover rounded-full">
                            </div>
                            <span class="text-[10px] font-bold text-slate-700 text-center mt-1.5 leading-tight">${s.name}<br><span class="font-extrabold" style="color: ${primary}">${s.price}</span></span>
                        </div>`).join('');

    // 3. Build Gallery HTML
    const galleryHtml = (brand.gallery || []).map((g, idx) => `
                    <!-- Gallery Item ${idx + 1}: ${g.title} -->
                    <div class="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer bg-slate-100 aspect-square border border-slate-200/60"
                        onclick="openGalleryModal('${g.image}', '${escapeHtml(g.title)}', '${escapeHtml(g.badge)}', '${escapeHtml(g.desc)}')">
                        <img src="${g.image}" alt="${escapeHtml(g.title)}"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                            <span class="text-[9px] font-black uppercase tracking-wider text-amber-300">${escapeHtml(g.badge)}</span>
                            <h4 class="text-xs font-bold text-white leading-tight mt-0.5 line-clamp-1">${escapeHtml(g.title)}</h4>
                        </div>
                    </div>`).join('');

    // 4. Build About Highlights HTML
    const aboutHighlightsHtml = (brand.about && brand.about.highlights ? brand.about.highlights : []).map(h => `
                        <div class="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <span class="text-xl flex-shrink-0">${h.icon}</span>
                            <div>
                                <h4 class="text-xs font-bold text-slate-900">${escapeHtml(h.title)}</h4>
                                <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">${escapeHtml(h.subtitle)}</p>
                            </div>
                        </div>`).join('');

    // 5. Build Welcome Modal Items HTML
    const modalItemsHtml = (brand.welcomeModal && brand.welcomeModal.items ? brand.welcomeModal.items : []).map(it => {
        if (it.isNotSure) {
            return `
                <!-- Not Sure -->
                <button type="button" class="modal-food-item flex flex-col items-center gap-1.5" onclick="toggleWelcomeItem(this, '${it.key}', '${it.categoryKey || 'ALL'}')">
                    <div class="modal-circle relative w-[72px] h-[72px] rounded-full overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center">
                        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01"/>
                        </svg>
                        <div class="modal-checkmark absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm" style="background-color: ${primary}">✓</div>
                    </div>
                    <span class="text-[11px] font-bold text-slate-700 text-center leading-tight">${it.label}</span>
                </button>`;
        }
        return `
                <!-- ${it.label} -->
                <button type="button" class="modal-food-item flex flex-col items-center gap-1.5" onclick="toggleWelcomeItem(this, '${it.key}', '${it.categoryKey || 'FOOD'}')">
                    <div class="modal-circle relative w-[72px] h-[72px] rounded-full overflow-hidden shadow-sm bg-slate-50">
                        <img src="${it.image}" alt="${it.label}" class="w-full h-full object-cover">
                        <div class="modal-checkmark absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm" style="background-color: ${primary}">✓</div>
                    </div>
                    <span class="text-[11px] font-bold text-slate-700 text-center leading-tight">${it.label}</span>
                </button>`;
    }).join('\n');

    // 6. Generate Complete Standalone HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brand.name} — Review & Experience</title>
    <meta name="description" content="${brand.tagline}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --brand-primary: ${primary};
            --brand-primary-hover: ${primaryHover};
            --brand-primary-light: ${primaryLight};
            --brand-primary-shadow: ${primaryShadow};
            --brand-accent: ${accent};
            --brand-accent-glow: ${accentGlow};
            --brand-gradient: ${gradientBg};
        }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--brand-gradient);
            min-height: 100vh;
        }
        .font-script { font-family: 'Caveat', cursive; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .chip-active {
            background-color: var(--brand-primary) !important;
            color: #ffffff !important;
            border-color: var(--brand-primary) !important;
            box-shadow: 0 4px 12px var(--brand-primary-shadow);
        }
        .modal-circle { border: 2.5px solid transparent; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .modal-food-item.is-selected .modal-circle {
            border-color: var(--brand-primary);
            box-shadow: 0 0 0 3px var(--brand-primary-light);
            transform: scale(1.05);
        }
        .modal-checkmark { opacity: 0; transform: scale(0.5); transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .modal-food-item.is-selected .modal-checkmark { opacity: 1; transform: scale(1); }
    </style>
</head>
<body class="text-slate-900 antialiased selection:bg-pink-100 selection:text-pink-900 pb-20">

    <div class="max-w-md mx-auto relative min-h-screen">

        <!-- HEADER -->
        <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm" style="background: ${primary}">
                    ${brand.initials || 'SB'}
                </div>
                <div>
                    <h1 class="text-sm font-extrabold text-slate-900 leading-none">${brand.shortName || brand.name}</h1>
                    <span class="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ${brand.statusBadge || 'Open Now'}
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-1.5">
                <a href="tel:${brand.contact?.phone || ''}" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors" title="Call">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </a>
                <a href="${brand.links?.googleMapsUrl || '#'}" target="_blank" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors" title="Directions">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </a>
            </div>
        </header>

        <!-- SCREEN 1: HERO IDENTITY CARD -->
        <section class="px-3 pt-3">
            <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
                <div class="w-full h-44 rounded-2xl overflow-hidden mb-3 relative bg-slate-100 shadow-inner">
                    <img src="${brand.heroImage}" alt="${brand.name}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                    <div class="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                        <span class="text-xs font-bold drop-shadow-md">${brand.categoryBadge || ''}</span>
                        <span class="text-[11px] font-semibold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">${brand.badgeText || ''}</span>
                    </div>
                </div>

                <h2 class="text-xl font-black text-slate-900 tracking-tight uppercase">${brand.name}</h2>
                <div class="flex items-center justify-center gap-1.5 mt-1">
                    <div class="flex text-amber-400 text-xs">${brand.ratingStars || '★★★★★'}</div>
                    <span class="text-xs font-extrabold text-slate-800">${brand.rating || '4.9'}</span>
                    <span class="text-[11px] text-slate-500">${brand.ratingCountText || '(800+ reviews)'}</span>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" class="h-3 ml-1 opacity-80">
                </div>
                <p class="text-xs text-slate-500 mt-1.5 px-3 font-medium leading-relaxed">${brand.tagline}</p>

                <!-- Feature Tags -->
                <div class="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                    ${featureTagsHtml}
                </div>
            </div>
        </section>

        <!-- SCREEN 2: AI REVIEW GENERATOR -->
        <section id="aiSection" class="px-3 pt-3">
            <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: ${primaryLight}; color: ${primary}">
                        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight">Loved your experience?</h3>
                        <p class="text-xs text-slate-500 font-medium">Tap what you liked & generate your review ✨</p>
                    </div>
                </div>

                <!-- Category Chips -->
                <div class="flex flex-wrap gap-1.5 mb-3">
                    <button type="button" class="category-chip px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all chip-active" onclick="toggleCategoryChip(this, 'ALL')">Overall Experience ✨</button>
                    <button type="button" class="category-chip px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all" onclick="toggleCategoryChip(this, 'FOOD')">Taste & Food 🍨</button>
                    <button type="button" class="category-chip px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all" onclick="toggleCategoryChip(this, 'VIBES')">Ambience & Music 🎶</button>
                    <button type="button" class="category-chip px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all" onclick="toggleCategoryChip(this, 'SERVICE')">Friendly Staff 🤝</button>
                    <button type="button" class="category-chip px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all" onclick="toggleCategoryChip(this, 'VALUE')">Value for Money 💸</button>
                </div>

                <!-- Selected Item Indicator -->
                <div id="selectedMenuSummary" class="hidden text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2 mb-2 flex items-center justify-between">
                    <span>Including: <span id="selectedMenuSummaryText" class="font-extrabold" style="color: ${primary}"></span></span>
                    <button type="button" onclick="openWelcomeModal()" class="text-[10px] underline hover:text-slate-900">Change</button>
                </div>

                <!-- Languages -->
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Review Language</span>
                    <div class="inline-flex p-0.5 rounded-xl bg-slate-100 text-xs font-bold">
                        <button type="button" class="lang-btn px-2.5 py-1 rounded-lg transition-all bg-white text-slate-900 shadow-xs" onclick="setLanguage('ENGLISH')">English</button>
                        <button type="button" class="lang-btn px-2.5 py-1 rounded-lg transition-all text-slate-500 hover:text-slate-900" onclick="setLanguage('HINGLISH')">Hinglish</button>
                        <button type="button" class="lang-btn px-2.5 py-1 rounded-lg transition-all text-slate-500 hover:text-slate-900" onclick="setLanguage('HINDI')">हिंदी</button>
                    </div>
                </div>

                <!-- Textarea -->
                <div class="relative">
                    <textarea id="aiReviewOutput" rows="4" class="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-3 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 transition-all resize-none" style="--tw-ring-color: ${primary}"></textarea>
                    <button type="button" onclick="regenerateReview()" class="absolute bottom-2.5 right-2.5 p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-600" title="Get another review">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    </button>
                </div>

                <!-- Primary CTA -->
                <button type="button" onclick="copyAndRedirectReview()" class="w-full mt-3 py-3 px-4 rounded-2xl text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]" style="background: ${primary}; box-shadow: 0 10px 20px ${primaryShadow}">
                    <span>Copy Review & Open Google Maps</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
            </div>
        </section>

        <!-- SCREEN 3: SPECIALITIES ROW -->
        <section class="px-3 pt-3">
            <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-md">
                <div class="flex items-center justify-between mb-3 px-1">
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-tight">Our Specialities</h3>
                    <span class="text-[10px] font-bold text-slate-400">Swipe to explore →</span>
                </div>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                    ${specialitiesHtml}
                </div>
            </div>
        </section>

        <!-- SCREEN 4: FEATURE PROMO BANNER -->
        ${brand.promoBanner && brand.promoBanner.image ? `
        <section class="px-3 pt-3">
            <div class="rounded-3xl overflow-hidden shadow-lg border border-slate-100 bg-slate-900 group">
                <img src="${brand.promoBanner.image}" alt="${brand.promoBanner.alt || brand.name}" class="w-full h-auto object-cover block">
            </div>
        </section>` : ''}

        <!-- SCREEN 5: GALLERY -->
        <section class="px-3 pt-3">
            <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-md">
                <div class="flex items-center justify-between mb-3 px-1">
                    <div>
                        <h3 class="text-xs font-black text-slate-900 uppercase tracking-tight">Photo Gallery</h3>
                        <p class="text-[10px] text-slate-500 font-medium">Authentic moments & delicious treats</p>
                    </div>
                    <span class="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">${brand.gallery?.length || 0} Photos</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${galleryHtml}
                </div>
            </div>
        </section>

        <!-- SCREEN 6: ABOUT -->
        <section class="px-3 pt-3">
            <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-md">
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-tight mb-1.5">${brand.about?.title || 'About Us'}</h3>
                <p class="text-xs text-slate-600 leading-relaxed font-medium mb-3">${brand.about?.story || ''}</p>
                <div class="space-y-2">
                    ${aboutHighlightsHtml}
                </div>
            </div>
        </section>

        <!-- SCREEN 7: LOCATION & HOURS -->
        <section class="px-3 pt-3">
            <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-md">
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-tight mb-2">Visit & Connect</h3>
                <div class="space-y-2 text-xs">
                    <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span class="text-slate-400 mt-0.5">🕒</span>
                        <div>
                            <span class="font-bold text-slate-800">${brand.hours?.status || 'Open Daily'}</span>
                            <p class="text-[11px] text-slate-500 mt-0.5">${brand.hours?.display || '11:00 AM - 11:00 PM'}</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span class="text-slate-400 mt-0.5">📍</span>
                        <div>
                            <span class="font-bold text-slate-800">${brand.contact?.shortAddress || brand.contact?.address || ''}</span>
                            <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">${brand.contact?.address || ''}</p>
                        </div>
                    </div>
                </div>

                ${brand.links?.mapsEmbedUrl ? `
                <div class="mt-3 rounded-2xl overflow-hidden border border-slate-100 h-40">
                    <iframe src="${brand.links.mapsEmbedUrl}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                </div>` : ''}

                <a href="${brand.links?.googleMapsUrl || '#'}" target="_blank" class="w-full mt-3 py-2.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors">
                    <span>Open in Google Maps</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
            </div>
        </section>

        <!-- FOOTER & ONESCAN -->
        <footer class="px-3 pt-6 pb-12 text-center text-slate-400 text-[11px]">
            <p class="font-medium">${brand.name} • All rights reserved</p>
            <p class="mt-1 text-[10px] text-slate-400">Powered by <a href="${brand.marketing?.instagramUrl || 'https://instagram.com/onescan360'}" target="_blank" class="font-bold text-slate-600 hover:text-slate-900">ONE Scan 360</a></p>
        </footer>

    </div>

    <!-- WELCOME MODAL -->
    <div id="welcomeModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity duration-300">
        <div class="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="text-center mb-4">
                <span class="text-[10px] font-black uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">Welcome Experience</span>
                <h3 class="text-base font-black text-slate-900 mt-2 leading-tight">${brand.welcomeModal?.heading || 'What did you treat yourself to?'}</h3>
                <p class="text-xs text-slate-500 mt-1">${brand.welcomeModal?.subheading || 'Choose one or more items'}</p>
            </div>

            <div class="grid grid-cols-3 gap-3 mb-5">
                ${modalItemsHtml}
            </div>

            <button type="button" id="modalConfirmBtn" onclick="confirmWelcomeModal()" class="w-full py-3 rounded-2xl text-white font-extrabold text-xs shadow-lg transition-all opacity-50 cursor-not-allowed" style="background: ${primary}" disabled>
                View My Review ✨
            </button>
            <button type="button" onclick="closeWelcomeModal()" class="w-full text-center text-xs text-slate-400 font-semibold mt-3 hover:text-slate-600">
                Skip for now
            </button>
        </div>
    </div>

    <!-- GALLERY LIGHTBOX MODAL -->
    <div id="galleryModal" class="fixed inset-0 z-50 hidden bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4" onclick="closeGalleryModal()">
        <div class="max-w-sm w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800" onclick="event.stopPropagation()">
            <div class="relative aspect-square bg-slate-950">
                <img id="galleryModalImg" src="" alt="" class="w-full h-full object-cover">
                <button type="button" onclick="closeGalleryModal()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold">✕</button>
            </div>
            <div class="p-4">
                <span id="galleryModalBadge" class="text-[10px] font-black uppercase tracking-wider text-amber-400"></span>
                <h4 id="galleryModalTitle" class="text-sm font-bold text-white mt-1"></h4>
                <p id="galleryModalDesc" class="text-xs text-slate-400 mt-1 leading-relaxed"></p>
            </div>
        </div>
    </div>

    <!-- TOAST -->
    <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 opacity-0 pointer-events-none transition-opacity duration-200">
        <span id="toastIcon">✨</span>
        <span id="toastMessage">Copied!</span>
    </div>

    <!-- SCRIPT RUNTIME -->
    <script>
        const STORE_CONFIG = ${JSON.stringify(brand, null, 2)};

        let selectedChips = new Set(['ALL']);
        let currentLang = 'ENGLISH';
        let chosenItems = [];

        const REVIEWS_LIBRARY = {
            ENGLISH: [
                "Had an amazing experience at ${brand.shortName}! The food quality was outstanding, the service was super warm, and the vibe was perfect. Highly recommended!",
                "One of the best hangout spots in town! Everything we ordered was fresh, flavorful, and beautifully served. Can't wait to visit again!",
                "Loved everything about ${brand.shortName}! Great menu selection, pocket-friendly prices, and super friendly staff. 5 stars all the way!"
            ],
            HINGLISH: [
                "${brand.shortName} ka experience bohot hi shaandaar tha! Food super fresh aur tasty tha, staff bohot polite tha aur vibe ekdum cozy. Definitely visiting again!",
                "Bohot hi mast cafe hai! Quality aur taste dono top-notch the. Friends aur family ke sath chill karne ke liye best jagah hai.",
                "Inka taste aur service dono lajawab the! Super value for money aur clean hygienic setup. 5 stars!"
            ],
            HINDI: [
                "${brand.shortName} में बहुत ही शानदार अनुभव रहा! यहाँ का खाना बहुत ताज़ा और स्वादिष्ट था और स्टाफ़ का व्यवहार भी बहुत विनम्र था। ज़रूर आएं!",
                "यहाँ का स्वाद और माहौल दोनों ही लाजवाब थे! बहुत ही साफ-सुथरी जगह और बेहतरीन सेवा। 5 स्टार अनुभव!",
                "दोस्त और परिवार के साथ समय बिताने के लिए बेहतरीन जगह। सभी व्यंजन बहुत ताज़ा और स्वादिष्ट थे।"
            ]
        };

        function showToast(msg, icon = '✨') {
            const toast = document.getElementById('toast');
            document.getElementById('toastMessage').textContent = msg;
            document.getElementById('toastIcon').textContent = icon;
            toast.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => toast.classList.add('opacity-0', 'pointer-events-none'), 2200);
        }

        function toggleWelcomeItem(btn, itemKey, categoryKey) {
            btn.classList.toggle('is-selected');
            const selected = document.querySelectorAll('.modal-food-item.is-selected');
            const confirmBtn = document.getElementById('modalConfirmBtn');
            if (selected.length > 0) {
                confirmBtn.removeAttribute('disabled');
                confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                confirmBtn.setAttribute('disabled', 'true');
                confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }

        function confirmWelcomeModal() {
            const selected = document.querySelectorAll('.modal-food-item.is-selected');
            chosenItems = [];
            selected.forEach(el => {
                const span = el.querySelector('span');
                if (span) chosenItems.push(span.textContent.trim());
            });
            closeWelcomeModal();
            if (chosenItems.length > 0) {
                document.getElementById('selectedMenuSummaryText').textContent = chosenItems.join(', ');
                document.getElementById('selectedMenuSummary').classList.remove('hidden');
            }
            regenerateReview();
        }

        function closeWelcomeModal() {
            document.getElementById('welcomeModal').classList.add('hidden');
        }

        function openWelcomeModal() {
            document.getElementById('welcomeModal').classList.remove('hidden');
        }

        function toggleCategoryChip(btn, category) {
            if (category === 'ALL') {
                selectedChips.clear();
                selectedChips.add('ALL');
                document.querySelectorAll('.category-chip').forEach(b => b.classList.remove('chip-active'));
                btn.classList.add('chip-active');
            } else {
                selectedChips.delete('ALL');
                document.querySelector('.category-chip').classList.remove('chip-active');
                if (selectedChips.has(category)) {
                    if (selectedChips.size > 1) {
                        selectedChips.delete(category);
                        btn.classList.remove('chip-active');
                    }
                } else {
                    selectedChips.add(category);
                    btn.classList.add('chip-active');
                }
            }
            regenerateReview();
        }

        function quickSelectCategory(cat) {
            const aiSec = document.getElementById('aiSection');
            if (aiSec) aiSec.scrollIntoView({ behavior: 'smooth' });
            regenerateReview();
        }

        function setLanguage(lang) {
            currentLang = lang;
            document.querySelectorAll('.lang-btn').forEach(b => {
                b.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
                b.classList.add('text-slate-500');
            });
            event.target.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
            event.target.classList.remove('text-slate-500');
            regenerateReview();
        }

        let reviewIndex = 0;
        function regenerateReview() {
            const list = REVIEWS_LIBRARY[currentLang] || REVIEWS_LIBRARY.ENGLISH;
            let text = list[reviewIndex % list.length];
            reviewIndex++;
            if (chosenItems.length > 0) {
                const dishesText = chosenItems.slice(0, 2).join(' & ');
                if (currentLang === 'HINGLISH') {
                    text += " Especially loved their " + dishesText + "!";
                } else if (currentLang === 'HINDI') {
                    text += " विशेष रूप से यहाँ के " + dishesText + " का स्वाद बहुत बढ़िया था!";
                } else {
                    text += " Loved their " + dishesText + " in particular!";
                }
            }
            document.getElementById('aiReviewOutput').value = text;
        }

        function copyAndRedirectReview() {
            const text = document.getElementById('aiReviewOutput').value;
            navigator.clipboard.writeText(text).then(() => {
                showToast('Review copied! Opening Google Maps...', '📋');
                setTimeout(() => {
                    const reviewUrl = STORE_CONFIG.links?.googleReviewUrl || STORE_CONFIG.links?.googleMapsUrl || '#';
                    window.open(reviewUrl, '_blank');
                }, 900);
            }).catch(() => {
                window.open(STORE_CONFIG.links?.googleReviewUrl || '#', '_blank');
            });
        }

        function openGalleryModal(img, title, badge, desc) {
            document.getElementById('galleryModalImg').src = img;
            document.getElementById('galleryModalTitle').textContent = title;
            document.getElementById('galleryModalBadge').textContent = badge;
            document.getElementById('galleryModalDesc').textContent = desc;
            document.getElementById('galleryModal').classList.remove('hidden');
        }

        function closeGalleryModal() {
            document.getElementById('galleryModal').classList.add('hidden');
        }

        // Init on load
        window.addEventListener('DOMContentLoaded', () => {
            regenerateReview();
        });
    </script>
</body>
</html>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = { compileMerchant };
