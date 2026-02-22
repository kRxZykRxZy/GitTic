import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import * as paymentMethodRepo from "../db/repositories/payment-method-repo.js";
import { validate } from "../middleware/input-validator.js";

/**
 * Payment Methods Routes
 * 
 * Securely manage user payment methods
 * Card data is encrypted before storage
 */
const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/v1/user/payment-methods
 * 
 * Add a new payment method
 */
router.post(
    "/",
    validate([
        { field: "cardNumber", location: "body", type: "string", required: true, pattern: /^\d{13,19}$/ },
        { field: "expiryMonth", location: "body", type: "number", required: true, min: 1, max: 12 },
        { field: "expiryYear", location: "body", type: "number", required: true },
        { field: "cvv", location: "body", type: "string", required: true, pattern: /^\d{3,4}$/ },
        { field: "cardholderName", location: "body", type: "string", required: true, min: 2, max: 100 },
    ]),
    async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;

            const paymentMethod = paymentMethodRepo.createPaymentMethod({
                userId,
                type: "card",
                cardNumber: req.body.cardNumber.replace(/\s/g, ""),
                expiryMonth: parseInt(req.body.expiryMonth),
                expiryYear: parseInt(req.body.expiryYear),
                cvv: req.body.cvv,
                cardholderName: req.body.cardholderName,
                billingAddress: req.body.billingAddress,
            });

            res.status(201).json({
                success: true,
                data: paymentMethod,
                message: "Payment method added successfully",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to add payment method";
            res.status(400).json({
                success: false,
                error: message,
            });
        }
    }
);

/**
 * GET /api/v1/user/payment-methods
 * 
 * List user's payment methods
 */
router.get("/", (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const methods = paymentMethodRepo.listPaymentMethods(userId);

        res.json({
            success: true,
            data: methods,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch payment methods",
        });
    }
});

/**
 * GET /api/v1/user/payment-methods/:id
 * 
 * Get a specific payment method
 */
router.get("/:id", (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const method = paymentMethodRepo.getPaymentMethod(id, userId);

        if (!method) {
            res.status(404).json({
                success: false,
                error: "Payment method not found",
            });
            return;
        }

        res.json({
            success: true,
            data: method,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch payment method",
        });
    }
});

/**
 * PUT /api/v1/user/payment-methods/:id/default
 * 
 * Set a payment method as default
 */
router.put("/:id/default", (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        paymentMethodRepo.setDefaultPaymentMethod(id, userId);

        res.json({
            success: true,
            message: "Default payment method updated",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: "Failed to update default payment method",
        });
    }
});

/**
 * DELETE /api/v1/user/payment-methods/:id
 * 
 * Delete a payment method
 */
router.delete("/:id", (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        paymentMethodRepo.deletePaymentMethod(id, userId);

        res.json({
            success: true,
            message: "Payment method deleted",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete payment method";
        res.status(400).json({
            success: false,
            error: message,
        });
    }
});

export default router;
