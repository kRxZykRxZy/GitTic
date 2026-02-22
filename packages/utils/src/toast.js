"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToast = createToast;
/**
 * Create a toast message payload.
 */
function createToast(type, category, title, text, timer = 5000) {
    return {
        id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        category,
        title,
        text,
        timer,
        dismissible: true,
        timestamp: Date.now(),
    };
}
//# sourceMappingURL=toast.js.map