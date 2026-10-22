const fs = require('fs');
const path = require('path');

/**
 * ============================================================================
 * BLACKTHRONE ENGINE — MASTER COMPILER
 * Compiles any merchant JSON preset into a production-ready landing page.
 * ============================================================================
 */

function compileMerchant(config, options = {}) {
    if (config.businessType === 'cell_phone_store' || config.template === 'retail_mobile') {
        return compileCellPhoneStore(config, options);
    }
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

    // Determine business type context
    const isRetailStore = ['cell_phone_store', 'electronics_store', 'retail'].includes(brand.businessType);
    const gallerySubtitle = isRetailStore ? 'Our store & products' : 'Authentic moments & delicious treats';
    const specialitiesTitle = isRetailStore ? 'Our Services' : 'Our Specialities';
    const welcomeModalBadge = isRetailStore ? 'Service Selector' : 'Welcome Experience';

    // Custom review categories from config (or defaults for food businesses)
    const reviewChips = (brand.reviewCategories && brand.reviewCategories.chips) ? brand.reviewCategories.chips : [
        { label: 'Overall Experience ✨', key: 'ALL' },
        { label: 'Taste & Food 🍨', key: 'FOOD' },
        { label: 'Ambience & Music 🎶', key: 'VIBES' },
        { label: 'Friendly Staff 🤝', key: 'SERVICE' },
        { label: 'Value for Money 💸', key: 'VALUE' }
    ];

    // Custom reviews from config (or defaults)
    const customReviews = (brand.reviewCategories && brand.reviewCategories.reviews) ? brand.reviewCategories.reviews : null;

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
                    ${reviewChips.map((chip, idx) => `<button type="button" class="category-chip px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all${idx === 0 ? ' chip-active' : ''}" onclick="toggleCategoryChip(this, '${chip.key}')">${escapeHtml(chip.label)}</button>`).join('\n                    ')}
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
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-tight">${specialitiesTitle}</h3>
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
                        <p class="text-[10px] text-slate-500 font-medium">${gallerySubtitle}</p>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border" style="color: ${primary}; background: ${primaryLight}; border-color: ${primary}30">${brand.gallery?.length || 0} Photos</span>
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
                <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border" style="color: ${primary}; background: ${primaryLight}; border-color: ${primary}30">${welcomeModalBadge}</span>
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

        const REVIEWS_LIBRARY = ${customReviews ? JSON.stringify(customReviews, null, 12) : `{
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
        }`};

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
                const itemsText = chosenItems.slice(0, 2).join(' & ');
                const isRetail = STORE_CONFIG.businessType === 'cell_phone_store' || STORE_CONFIG.businessType === 'electronics_store' || STORE_CONFIG.businessType === 'retail';
                if (currentLang === 'HINGLISH') {
                    text += isRetail ? " Especially " + itemsText + " service/product bohot accha tha!" : " Especially loved their " + itemsText + "!";
                } else if (currentLang === 'HINDI') {
                    text += isRetail ? " विशेष रूप से " + itemsText + " की सेवा/उत्पाद बहुत बढ़िया था!" : " विशेष रूप से यहाँ के " + itemsText + " का स्वाद बहुत बढ़िया था!";
                } else {
                    text += isRetail ? " Their " + itemsText + " service was exceptional!" : " Loved their " + itemsText + " in particular!";
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

/**
 * ============================================================================
 * CELL PHONE STORE & RETAIL COMPILER (Matches Reference Mockup)
 * ============================================================================
 */
function compileCellPhoneStore(brand, options = {}) {
    const primary = brand.theme?.primary || '#F59E0B';
    const primaryHover = brand.theme?.primaryHover || '#D97706';
    const primaryLight = brand.theme?.primaryLight || '#FFFBEB';
    const phoneRaw = brand.contact?.phone || '+919837044095';
    const phoneClean = phoneRaw.replace(/[^0-9]/g, '');
    const phoneBadge = brand.contact?.phoneBadge || '9837044095';
    const heroImage = brand.heroImage || './assets/images/wireless/storefront.jpg';
    const mapsUrl = brand.links?.googleMapsUrl || 'https://maps.app.goo.gl/oJhAJPuwUEkkn55b8';
    const reviewUrl = brand.links?.googleReviewUrl || mapsUrl;
    const websiteUrl = brand.links?.instagramUrl || mapsUrl;
    const whatsappNum = brand.contact?.whatsapp || phoneClean;

    // Review Chips
    const reviewChips = (brand.reviewCategories && brand.reviewCategories.chips) ? brand.reviewCategories.chips : [
        { label: 'Overall Experience ✨', key: 'ALL' },
        { label: 'Phone Repair 🔧', key: 'REPAIR' },
        { label: 'Lamination & Skins 🛡️', key: 'LAMINATION' },
        { label: 'Mobiles & 2nd Hand 📱', key: 'MOBILES' },
        { label: 'Accessories 🎧', key: 'ACCESSORIES' },
        { label: 'Staff & Support 🤝', key: 'SERVICE' }
    ];

    const reviewChipsHtml = reviewChips.map((chip, idx) => `
        <button type="button" data-cat="${chip.key}" class="category-chip px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all${idx === 0 ? ' chip-active' : ''}" onclick="toggleCategoryChip(this, '${chip.key}')">
            ${escapeHtml(chip.label)}
        </button>
    `).join('\n');

    // Gallery HTML
    const galleryHtml = (brand.gallery || []).map((g, idx) => `
        <div class="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer bg-slate-900 aspect-square border border-slate-200/80"
            onclick="openGalleryModal('${g.image}', '${escapeHtml(g.title)}', '${escapeHtml(g.badge)}', '${escapeHtml(g.desc)}')">
            <img src="${g.image}" alt="${escapeHtml(g.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-2.5">
                <span class="text-[9px] font-black uppercase tracking-wider text-amber-300">${escapeHtml(g.badge)}</span>
                <h4 class="text-xs font-bold text-white leading-tight mt-0.5 line-clamp-1">${escapeHtml(g.title)}</h4>
            </div>
        </div>
    `).join('\n');

    // Highlights HTML
    const aboutHighlightsHtml = (brand.about?.highlights || [
        { icon: '🔧', title: 'Expert Phone Repairs', subtitle: 'Same-day screen replacement, battery repair & motherboard fixes' },
        { icon: '🛡️', title: 'Precision Lamination & Skins', subtitle: 'Zero bubble wrap, premium matte/gloss finishes for all smartphone models' },
        { icon: '💰', title: 'Best Prices Guaranteed', subtitle: 'Competitive pricing on new phones, accessories & reliable 2nd hand devices' }
    ]).map(h => `
        <div class="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span class="text-xl flex-shrink-0">${h.icon}</span>
            <div>
                <h4 class="text-xs font-bold text-slate-900">${escapeHtml(h.title)}</h4>
                <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">${escapeHtml(h.subtitle)}</p>
            </div>
        </div>
    `).join('\n');

    // Modal items HTML
    const modalItemsHtml = (brand.welcomeModal && brand.welcomeModal.items ? brand.welcomeModal.items : []).map(it => {
        if (it.isNotSure) {
            return `
                <button type="button" class="modal-service-item flex flex-col items-center gap-1.5" onclick="toggleWelcomeItem(this, '${it.key}', '${it.categoryKey || 'ALL'}')">
                    <div class="modal-circle relative w-[68px] h-[68px] rounded-full overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                        <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01"/>
                        </svg>
                        <div class="modal-checkmark absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">✓</div>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 text-center leading-tight">${it.label}</span>
                </button>`;
        }
        return `
            <button type="button" class="modal-service-item flex flex-col items-center gap-1.5" onclick="toggleWelcomeItem(this, '${it.key}', '${it.categoryKey || 'SERVICE'}')">
                <div class="modal-circle relative w-[68px] h-[68px] rounded-full overflow-hidden shadow-sm bg-slate-50 border-2 border-slate-200">
                    <img src="${it.image || heroImage}" alt="${it.label}" class="w-full h-full object-cover">
                    <div class="modal-checkmark absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">✓</div>
                </div>
                <span class="text-[10px] font-bold text-slate-700 text-center leading-tight">${it.label}</span>
            </button>`;
    }).join('\n');

    const customReviews = brand.reviewCategories?.reviews || null;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brand.name} — Mobiles, Repairs & Accessories</title>
    <meta name="description" content="${brand.tagline}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0B0F17;
            min-height: 100vh;
        }
        .font-script { font-family: 'Caveat', cursive; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .neon-wireless {
            text-shadow: 0 0 10px #FACC15, 0 0 25px rgba(250, 204, 21, 0.9), 0 0 50px rgba(234, 179, 8, 0.6);
        }
        .chip-active {
            background-color: #F59E0B !important;
            color: #0F172A !important;
            border-color: #F59E0B !important;
            font-weight: 800 !important;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
        }
        .modal-circle { border: 2.5px solid transparent; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .modal-service-item.is-selected .modal-circle {
            border-color: #F59E0B;
            box-shadow: 0 0 0 3px #FEF3C7;
            transform: scale(1.05);
        }
        .modal-checkmark { opacity: 0; transform: scale(0.5); transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .modal-service-item.is-selected .modal-checkmark { opacity: 1; transform: scale(1); }
    </style>
</head>
<body class="text-slate-900 antialiased selection:bg-amber-100 selection:text-amber-900 pb-24">

    <!-- APP CONTAINER -->
    <div class="max-w-md mx-auto relative min-h-screen bg-slate-950 shadow-2xl overflow-hidden">

        <!-- 1. HERO BANNER WITH STORE PHOTO & NEON OVERLAYS -->
        <section class="relative w-full h-[330px] sm:h-[360px] overflow-hidden bg-slate-950">
            <!-- Storefront Photo Background -->
            <img src="${heroImage}" alt="${brand.name} Storefront" class="w-full h-full object-cover object-center filter brightness-90">
            <!-- Dark Gradient Vignette Overlay -->
            <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/90"></div>

            <!-- Top Right Phone Pill -->
            <div class="absolute top-3.5 right-3.5 z-20">
                <a href="tel:${phoneClean}" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-md hover:bg-black/90 transition-all">
                    <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    <span>${phoneBadge}</span>
                </a>
            </div>

            <!-- Top Left Script: Your Device Our Care -->
            <div class="absolute top-6 left-4 z-10 select-none">
                <p class="font-script text-white text-xl sm:text-2xl font-bold -rotate-6 leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                    Your<br>Device<br>Our<br>Care
                </p>
            </div>

            <!-- Top Right Script: Mobiles Accessories Repairs & More -->
            <div class="absolute top-12 right-4 z-10 select-none text-right">
                <p class="font-script text-white text-xs sm:text-sm font-bold rotate-6 leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                    Mobiles<br>Accessories<br>Repairs<br>& More
                </p>
            </div>

            <!-- Floating Device Graphics on Sides -->
            <!-- Left iPhone Camera Bump -->
            <div class="absolute -left-8 bottom-6 w-24 h-40 rounded-3xl bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-100 border-2 border-slate-300 shadow-2xl -rotate-12 opacity-85 pointer-events-none p-1.5 flex flex-col justify-start">
                <div class="w-10 h-10 rounded-2xl bg-slate-300/80 p-1.5 grid grid-cols-2 gap-1 border border-slate-400/50 shadow-inner">
                    <div class="w-3 h-3 rounded-full bg-slate-900 border border-slate-700 shadow-xs"></div>
                    <div class="w-3 h-3 rounded-full bg-slate-900 border border-slate-700 shadow-xs"></div>
                    <div class="w-3 h-3 rounded-full bg-slate-900 border border-slate-700 shadow-xs"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-amber-400 self-center justify-self-center"></div>
                </div>
            </div>

            <!-- Right Over-ear Headphones Accent -->
            <div class="absolute -right-5 top-5 w-18 h-18 rounded-full bg-slate-900/90 border border-slate-700 shadow-2xl rotate-12 opacity-80 pointer-events-none flex items-center justify-center p-2.5">
                <svg class="w-10 h-10 text-slate-300 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12v5c0 1.66 1.34 3 3 3h2v-8H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-3v8h2c1.66 0 3-1.34 3-3v-5c0-5.52-4.48-10-10-10z"/></svg>
            </div>

            <!-- Right Tilted Phone Back -->
            <div class="absolute -right-8 bottom-5 w-20 h-36 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 border border-slate-700 shadow-2xl rotate-12 opacity-80 pointer-events-none p-2 flex flex-col items-center justify-center">
                <span class="text-xs text-slate-500 font-mono"></span>
            </div>

            <!-- Center Glowing Neon Title & Subtitle -->
            <div class="absolute inset-0 flex flex-col items-center justify-center -mt-3 px-4 text-center z-10 pointer-events-none">
                <h2 class="neon-wireless font-script text-5xl sm:text-6xl font-black text-[#FACC15] tracking-wide select-none drop-shadow-[0_0_25px_rgba(250,204,21,0.9)]">
                    WIRELESS
                </h2>
                <div class="mt-2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-amber-400/40 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 shadow-md">
                    MOBILES • LAMINATION • REPAIRING • 2ND HAND PHONES • ACCESSORIES
                </div>
            </div>
        </section>

        <!-- 2. CENTRAL WHITE CARD (OVERLAPPING HERO) -->
        <main class="relative z-20 -mt-10 bg-white rounded-t-[36px] shadow-2xl px-4 sm:px-6 pt-0 pb-8">
            
            <!-- Circular Logo Avatar Overlapping the Hero -->
            <div class="relative -mt-10 mx-auto w-20 h-20 rounded-full bg-slate-950 border-[3.5px] border-amber-400 shadow-xl flex items-center justify-center">
                <span class="font-script text-amber-400 text-xl font-black tracking-wide drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">WIRELESS</span>
                <!-- Green Verified Checkmark -->
                <div class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-md">
                    <svg class="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
            </div>

            <!-- Title: WIRELESS -->
            <h1 class="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight text-center mt-3">${brand.name}</h1>

            <!-- Google Star Rating -->
            <div class="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                <div class="flex text-amber-400 text-sm tracking-tighter">★★★★★</div>
                <span class="text-sm font-extrabold text-slate-900">${brand.rating || '5.0'}</span>
                <span class="text-xs text-slate-500 font-medium">${brand.ratingCountText || '(3 reviews)'}</span>
                <span class="inline-flex items-center text-sm font-bold tracking-tight ml-1">
                    <span class="text-[#4285F4]">G</span><span class="text-[#EA4335]">o</span><span class="text-[#FBBC05]">o</span><span class="text-[#4285F4]">g</span><span class="text-[#34A853]">l</span><span class="text-[#EA4335]">e</span>
                </span>
            </div>

            <!-- Subtitle -->
            <p class="text-xs sm:text-sm font-semibold text-slate-500 text-center mt-1">Mobiles, Repairs & Accessories</p>

            <!-- 3. FOUR SERVICE QUICK CARDS (Grid of 4) -->
            <div class="grid grid-cols-4 gap-2 sm:gap-2.5 mt-5">
                <!-- Card 1: New & Second Hand Phones -->
                <div class="service-pill group bg-slate-50 hover:bg-amber-50/70 border border-slate-100 hover:border-amber-300 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200" onclick="quickSelectCategory('MOBILES', 'Phones')">
                    <div class="w-11 h-11 rounded-full bg-[#FFFBEB] border border-amber-200/80 flex items-center justify-center text-amber-600 mb-1.5 shadow-xs group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3" ry="3"/><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2.5" stroke-linecap="round"/></svg>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 leading-tight">New & Second Hand Phones</span>
                </div>

                <!-- Card 2: Repairs & Services -->
                <div class="service-pill group bg-slate-50 hover:bg-amber-50/70 border border-slate-100 hover:border-amber-300 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200" onclick="quickSelectCategory('REPAIR', 'Phone Repair')">
                    <div class="w-11 h-11 rounded-full bg-[#FFFBEB] border border-amber-200/80 flex items-center justify-center text-amber-600 mb-1.5 shadow-xs group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 leading-tight">Repairs & Services</span>
                </div>

                <!-- Card 3: Accessories -->
                <div class="service-pill group bg-slate-50 hover:bg-amber-50/70 border border-slate-100 hover:border-amber-300 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200" onclick="quickSelectCategory('ACCESSORIES', 'Accessories')">
                    <div class="w-11 h-11 rounded-full bg-[#FFFBEB] border border-amber-200/80 flex items-center justify-center text-amber-600 mb-1.5 shadow-xs group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 18v-6a9 9 0 0118 0v6"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/></svg>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 leading-tight">Accessories</span>
                </div>

                <!-- Card 4: Lamination -->
                <div class="service-pill group bg-slate-50 hover:bg-amber-50/70 border border-slate-100 hover:border-amber-300 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200" onclick="quickSelectCategory('LAMINATION', 'Lamination & Skins')">
                    <div class="w-11 h-11 rounded-full bg-[#FFFBEB] border border-amber-200/80 flex items-center justify-center text-amber-600 mb-1.5 shadow-xs group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2" stroke-dasharray="2 2"/><rect x="8" y="5" width="8" height="14" rx="1"/></svg>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 leading-tight">Lamination</span>
                </div>
            </div>

            <!-- 4. ABOUT BLURB WITH YELLOW ACCENT BAR & PHONE GRAPHIC -->
            <div class="mt-4 rounded-2xl bg-[#F8FAFC] border-l-4 border-amber-400 p-4 border border-slate-100/90 relative overflow-hidden flex items-center justify-between gap-3 shadow-xs">
                <div class="flex-1 pr-1">
                    <p class="text-xs text-slate-700 font-medium leading-relaxed">
                        Your trusted destination for mobiles, second hand phones, accessories, lamination and expert repairs. Genuine products, honest service and the latest accessories — all under one roof at <strong class="font-extrabold text-slate-900">WIRELESS</strong>.
                    </p>
                </div>
                <!-- Stylized Phone Graphic with Sparkles -->
                <div class="relative w-14 h-20 flex-shrink-0 flex items-center justify-center">
                    <div class="w-12 h-18 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 border-2 border-slate-600 shadow-md rotate-6 flex flex-col p-1 relative">
                        <div class="w-5 h-5 rounded-md bg-slate-800 p-0.5 grid grid-cols-2 gap-0.5 border border-slate-700">
                            <div class="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                            <div class="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                            <div class="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        </div>
                        <div class="mt-auto self-center text-[7px] text-slate-400 font-mono"></div>
                    </div>
                    <span class="absolute -top-1 -right-1 text-amber-400 text-sm">✨</span>
                    <span class="absolute bottom-0 -left-1 text-amber-400 text-xs">✨</span>
                </div>
            </div>

            <!-- 5. "WRITE A GOOGLE REVIEW WITH AI" CTA BANNER -->
            <div class="mt-4 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 p-4 sm:p-5 text-slate-950 shadow-lg shadow-amber-400/25 relative overflow-hidden">
                <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-yellow-300/40 rounded-full blur-xl pointer-events-none"></div>
                <div class="flex items-start gap-3 relative z-10">
                    <div class="relative w-12 h-12 flex-shrink-0 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-amber-200">
                        <div class="flex items-center gap-0.5 text-amber-400 text-[10px]">★★★</div>
                        <div class="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-950 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">AI</div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-sm sm:text-base font-black text-slate-950 leading-tight">Write a Google Review with AI</h3>
                        <p class="text-[11px] sm:text-xs font-semibold text-slate-800 mt-0.5 leading-snug">Help us grow! Get a personalized review draft in seconds.</p>
                    </div>
                </div>
                <button type="button" onclick="focusReviewGenerator()" class="w-full mt-3.5 py-3 px-5 rounded-full bg-slate-950 hover:bg-slate-900 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all group">
                    <span class="text-amber-400">✨</span>
                    <span>Generate My Review</span>
                    <svg class="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>

            <!-- 6. INTERACTIVE AI REVIEW GENERATOR SECTION -->
            <div id="aiSection" class="mt-5 pt-3 border-t border-slate-100 scroll-mt-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select What You Loved</span>
                    <button type="button" onclick="openWelcomeModal()" class="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5">
                        <span>Custom Service</span> ➔
                    </button>
                </div>

                <!-- Category Chips -->
                <div class="flex flex-wrap gap-1.5 mb-3">
                    ${reviewChipsHtml}
                </div>

                <!-- Selected Service Summary -->
                <div id="selectedMenuSummary" class="hidden text-[11px] font-bold text-slate-700 bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 mb-2.5 flex items-center justify-between">
                    <span>Service: <span id="selectedMenuSummaryText" class="font-black text-amber-700"></span></span>
                    <button type="button" onclick="openWelcomeModal()" class="text-[10px] text-slate-500 underline hover:text-slate-900">Change</button>
                </div>

                <!-- Review Language -->
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
                    <textarea id="aiReviewOutput" rows="4" class="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-3 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all resize-none"></textarea>
                    <button type="button" onclick="regenerateReview()" class="absolute bottom-2.5 right-2.5 p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-600 hover:text-amber-600 transition-colors" title="Generate another review draft">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    </button>
                </div>

                <!-- Primary CTA: Copy & Redirect -->
                <button type="button" onclick="copyAndRedirectReview()" class="w-full mt-3 py-3.5 px-4 rounded-2xl text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-amber-400 to-yellow-400 shadow-amber-400/25">
                    <span>Copy Review & Open Google Maps</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
            </div>

            <!-- 7. STORE GALLERY -->
            <div class="mt-6 pt-5 border-t border-slate-100">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h3 class="text-xs font-black text-slate-950 uppercase tracking-tight">Store Gallery</h3>
                        <p class="text-[10px] text-slate-500 font-medium">Inside WIRELESS & accessories</p>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700">${brand.gallery?.length || 4} Photos</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${galleryHtml}
                </div>
            </div>

            <!-- 8. WHY CHOOSE WIRELESS -->
            <div class="mt-6 pt-5 border-t border-slate-100">
                <h3 class="text-xs font-black text-slate-950 uppercase tracking-tight mb-2.5">Why Choose WIRELESS</h3>
                <div class="space-y-2">
                    ${aboutHighlightsHtml}
                </div>
            </div>

            <!-- 9. LOCATION & HOURS -->
            <div class="mt-6 pt-5 border-t border-slate-100">
                <h3 class="text-xs font-black text-slate-950 uppercase tracking-tight mb-2.5">Visit & Connect</h3>
                <div class="space-y-2 text-xs">
                    <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span class="text-amber-500 mt-0.5">🕒</span>
                        <div>
                            <span class="font-bold text-slate-900">${brand.hours?.status || 'Open Daily'}</span>
                            <p class="text-[11px] text-slate-500 mt-0.5">${brand.hours?.display || '10:00 AM - 9:00 PM'}</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span class="text-rose-500 mt-0.5">📍</span>
                        <div>
                            <span class="font-bold text-slate-900">${brand.contact?.shortAddress || brand.contact?.address || ''}</span>
                            <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">${brand.contact?.address || ''}</p>
                        </div>
                    </div>
                </div>

                ${brand.links?.mapsEmbedUrl ? `
                <div class="mt-3 rounded-2xl overflow-hidden border border-slate-200/80 h-44 shadow-xs">
                    <iframe src="${brand.links.mapsEmbedUrl}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                </div>` : ''}

                <a href="${brand.links?.googleMapsUrl || '#'}" target="_blank" class="w-full mt-3 py-2.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors">
                    <span>Open in Google Maps</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
            </div>

            <!-- FOOTER -->
            <footer class="mt-6 pt-4 text-center text-slate-400 text-[11px]">
                <p class="font-medium">${brand.name} • All rights reserved</p>
                <p class="mt-0.5 text-[10px] text-slate-400">Powered by <a href="${brand.marketing?.instagramUrl || 'https://instagram.com/onescan360'}" target="_blank" class="font-bold text-slate-600 hover:text-slate-900">ONE Scan 360</a></p>
            </footer>
        </main>

        <!-- 10. FIXED BOTTOM ACTION BAR (DOCK) -->
        <nav class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] py-2 px-3">
            <div class="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
                <!-- 1. View on Map -->
                <a href="${mapsUrl}" target="_blank" class="flex flex-col items-center justify-center py-1 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div class="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-1 group-hover:scale-105 transition-transform">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 leading-none">View on Map</span>
                </a>

                <!-- 2. Call Now -->
                <a href="tel:${phoneClean}" class="flex flex-col items-center justify-center py-1 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div class="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1 group-hover:scale-105 transition-transform">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 leading-none">Call Now</span>
                </a>

                <!-- 3. Visit Website / Instagram -->
                <a href="${websiteUrl}" target="_blank" class="flex flex-col items-center justify-center py-1 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div class="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mb-1 group-hover:scale-105 transition-transform">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 leading-none">Visit Website</span>
                </a>

                <!-- 4. WhatsApp -->
                <a href="https://wa.me/${whatsappNum}?text=Hi%20WIRELESS%2C%20I%20am%20interested%20in%20your%20services!" target="_blank" class="flex flex-col items-center justify-center py-1 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div class="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-[#25D366] mb-1 group-hover:scale-105 transition-transform">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 leading-none">WhatsApp</span>
                </a>
            </div>
        </nav>

    </div>

    <!-- 11. WELCOME MODAL -->
    <div id="welcomeModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4 transition-opacity duration-300">
        <div class="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="text-center mb-4">
                <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-700">Service Selector</span>
                <h3 class="text-base font-black text-slate-900 mt-2 leading-tight">${brand.welcomeModal?.heading || 'What service did you get<br>at WIRELESS?'}</h3>
                <p class="text-xs text-slate-500 mt-1">${brand.welcomeModal?.subheading || 'Choose one or more services'}</p>
            </div>

            <div class="grid grid-cols-3 gap-3 mb-5">
                ${modalItemsHtml}
            </div>

            <button type="button" id="modalConfirmBtn" onclick="confirmWelcomeModal()" class="w-full py-3 rounded-2xl text-slate-950 font-black text-xs shadow-lg transition-all opacity-50 cursor-not-allowed bg-amber-400" disabled>
                View My Review ✨
            </button>
            <button type="button" onclick="closeWelcomeModal()" class="w-full text-center text-xs text-slate-400 font-semibold mt-3 hover:text-slate-600">
                Skip for now
            </button>
        </div>
    </div>

    <!-- 12. GALLERY LIGHTBOX MODAL -->
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

    <!-- 13. TOAST -->
    <div id="toast" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 opacity-0 pointer-events-none transition-opacity duration-200 border border-slate-700">
        <span id="toastIcon">✨</span>
        <span id="toastMessage">Copied!</span>
    </div>

    <!-- CLIENT SCRIPT RUNTIME -->
    <script>
        const STORE_CONFIG = ${JSON.stringify(brand, null, 2)};
        let selectedChips = new Set(['ALL']);
        let currentLang = 'ENGLISH';
        let chosenItems = [];

        const REVIEWS_LIBRARY = ${customReviews ? JSON.stringify(customReviews, null, 12) : `{
            ENGLISH: [
                "Had an amazing experience at WIRELESS in Subhash Nagar! Outstanding service, genuine products, and very fair pricing. Highly recommended for any mobile phone needs!",
                "One of the best cell phone stores in Dehradun! Got my phone screen replaced and it looks and works like brand new. They also have a fantastic collection of skins and accessories.",
                "Loved the prompt service at WIRELESS! Wide range of new & 2nd hand phones, expert repair technicians, and precise lamination. 5 stars all the way!",
                "Super satisfied with the service! The staff is very polite and helpful. Best place in Dehradun for phone wraps, cases, and quick repairs.",
                "Transparent pricing and 100% genuine accessories. Got a full body lamination done with zero bubbles. Excellent work by the WIRELESS team!"
            ],
            HINGLISH: [
                "WIRELESS Subhash Nagar ka experience ekdum zabardast tha! Professional repair work, genuine products aur staff bohot cooperative hai. Dehradun me mobile needs ke liye best shop!",
                "Bohot hi badhiya store hai! Screen repair karwaya tha, ekdum original quality aur rate bhi reasonable. Skins aur covers ka collection bhi lajawab hai.",
                "WIRELESS se second-hand phone liya tha, condition bilkul new jaisi mili aur proper checking ke saath diya. Truly dependable and honest service!",
                "Lamination aur wraps ka kaam inka no. 1 hai Dehradun me. Bubble-free finish aur stylish designs. Highly recommended!",
                "Bhaiya ka behaviour bohot polite tha aur fast repair karke diya. Genuine accessories aur mast discounts. 5 stars!"
            ],
            HINDI: [
                "WIRELESS (सुभाष नगर) में बहुत ही शानदार अनुभव रहा! फोन रिपेयर बिल्कुल प्रोफेशनल था, पार्ट्स ओरिजिनल हैं और स्टाफ़ का व्यवहार बहुत विनम्र है। देहरादून में सबसे भरोसेमंद मोबाइल शॉप!",
                "यहाँ की सर्विस और प्रोडक्ट रेंज दोनों ही लाजवाब हैं! स्क्रीन बदलवाई और बिल्कुल नए जैसी लग रही है। उचित दाम और बेहतरीन काम। 5 स्टार अनुभव!",
                "फोन रिपेयर, लैमिनेशन और एक्सेसरीज़ के लिए सबसे बेहतरीन जगह। बिना किसी एयर बबल के एकदम परफेक्ट लैमिनेशन किया।",
                "नया और सेकंड हैंड फोन लेने के लिए बेस्ट दुकान। यहाँ पूरी ईमानदारी और पारदर्शिता के साथ काम होता है।",
                "स्टाफ बहुत ही मददगार है और सभी काम समय पर पूरा करते हैं। मोबाइल की किसी भी समस्या के लिए ज़रूर विजिट करें!"
            ]
        }`};

        function showToast(msg, icon = '✨') {
            const toast = document.getElementById('toast');
            document.getElementById('toastMessage').textContent = msg;
            document.getElementById('toastIcon').textContent = icon;
            toast.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                toast.classList.add('opacity-0', 'pointer-events-none');
            }, 2500);
        }

        function toggleWelcomeItem(btn, key, categoryKey) {
            btn.classList.toggle('is-selected');
            updateModalConfirmBtn();
        }

        function updateModalConfirmBtn() {
            const selected = document.querySelectorAll('.modal-service-item.is-selected');
            const btn = document.getElementById('modalConfirmBtn');
            if (selected.length > 0) {
                btn.removeAttribute('disabled');
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                btn.setAttribute('disabled', 'true');
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }

        function confirmWelcomeModal() {
            const selected = document.querySelectorAll('.modal-service-item.is-selected');
            chosenItems = [];
            let targetCategory = 'ALL';
            selected.forEach(el => {
                const text = el.querySelector('span').textContent.trim();
                chosenItems.push(text);
            });
            closeWelcomeModal();
            if (chosenItems.length > 0) {
                const summary = document.getElementById('selectedMenuSummary');
                const summaryText = document.getElementById('selectedMenuSummaryText');
                if (summary && summaryText) {
                    summaryText.textContent = chosenItems.join(', ');
                    summary.classList.remove('hidden');
                }
            }
            regenerateReview();
            const aiSec = document.getElementById('aiSection');
            if (aiSec) aiSec.scrollIntoView({ behavior: 'smooth' });
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
                const allChip = document.querySelector('.category-chip[data-cat="ALL"]');
                if (allChip) allChip.classList.remove('chip-active');
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

        function quickSelectCategory(catKey, serviceName) {
            if (catKey) {
                selectedChips.clear();
                selectedChips.add(catKey);
                document.querySelectorAll('.category-chip').forEach(btn => {
                    if (btn.getAttribute('data-cat') === catKey) {
                        btn.classList.add('chip-active');
                    } else {
                        btn.classList.remove('chip-active');
                    }
                });
            }
            if (serviceName) {
                chosenItems = [serviceName];
                const summary = document.getElementById('selectedMenuSummary');
                const summaryText = document.getElementById('selectedMenuSummaryText');
                if (summary && summaryText) {
                    summaryText.textContent = serviceName;
                    summary.classList.remove('hidden');
                }
            }
            regenerateReview();
            const aiSec = document.getElementById('aiSection');
            if (aiSec) {
                aiSec.scrollIntoView({ behavior: 'smooth' });
            }
        }

        function focusReviewGenerator() {
            const aiSec = document.getElementById('aiSection');
            if (aiSec) {
                aiSec.scrollIntoView({ behavior: 'smooth' });
                const textarea = document.getElementById('aiReviewOutput');
                if (textarea) {
                    textarea.focus();
                    textarea.classList.add('ring-2', 'ring-amber-400');
                    setTimeout(() => textarea.classList.remove('ring-2', 'ring-amber-400'), 1200);
                }
            }
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
                const itemsText = chosenItems.slice(0, 2).join(' & ');
                if (currentLang === 'HINGLISH') {
                    text += " Especially " + itemsText + " service/quality bohot hi shaandaar thi!";
                } else if (currentLang === 'HINDI') {
                    text += " विशेष रूप से " + itemsText + " का काम और क्वालिटी बहुत ही बढ़िया थी!";
                } else {
                    text += " Their " + itemsText + " service was truly exceptional!";
                }
            }
            document.getElementById('aiReviewOutput').value = text;
        }

        function copyAndRedirectReview() {
            const text = document.getElementById('aiReviewOutput').value;
            navigator.clipboard.writeText(text).then(() => {
                showToast('Review copied! Opening Google Maps...', '📋');
                setTimeout(() => {
                    const rUrl = STORE_CONFIG.links?.googleReviewUrl || STORE_CONFIG.links?.googleMapsUrl || '#';
                    window.open(rUrl, '_blank');
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
