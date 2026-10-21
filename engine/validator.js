/**
 * ============================================================================
 * BLACKTHRONE ENGINE — PRE-FLIGHT VALIDATOR
 * Ensures merchant configurations have zero missing links, zero invalid colors,
 * and valid assets before compilation.
 * ============================================================================
 */

function validateMerchant(config) {
    const errors = [];
    const warnings = [];

    if (!config.id) errors.push('Missing merchant "id" (slug).');
    if (!config.name) errors.push('Missing merchant "name".');
    if (!config.tagline) warnings.push('Merchant tagline is empty.');

    // Theme check
    if (!config.theme || !config.theme.primary) {
        errors.push('Missing theme.primary color code.');
    } else if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(config.theme.primary)) {
        errors.push(`Invalid hex color for theme.primary: "${config.theme.primary}".`);
    }

    // Welcome modal check
    if (!config.welcomeModal || !Array.isArray(config.welcomeModal.items) || config.welcomeModal.items.length < 3) {
        errors.push('Welcome modal must contain at least 3 menu items.');
    }

    // Specialities check
    if (!Array.isArray(config.specialities) || config.specialities.length < 3) {
        errors.push('Specialities array must contain at least 3 signature dishes.');
    }

    // Gallery check
    if (!Array.isArray(config.gallery) || config.gallery.length < 4) {
        warnings.push('Gallery has fewer than 4 photos. 6 to 8 photos recommended for optimal engagement.');
    }

    // Google Maps / Review Link check
    if (!config.links || (!config.links.googleReviewUrl && !config.links.googleMapsUrl)) {
        errors.push('Missing Google Review URL or Google Maps URL in links.');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

module.exports = { validateMerchant };
