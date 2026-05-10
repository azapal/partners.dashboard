import { AuthLayout } from "../layouts/AuthLayout.js";
import { DefaultButton } from "../components/buttons/DefaultButton.js";
import { DefaultTextInput } from "../components/inputs/DefaultTextInput.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { partnerActions } from "../store/server/auth";

// Validation schema
const onboardingValidationSchema = Yup.object().shape({
    fullName: Yup.string()
        .required("Full name is required")
        .min(2, "Full name must be at least 2 characters")
        .matches(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
});

export const PartnerOnboardingScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Get token from URL parameters
    const token = searchParams.get("token");

    // Validate that token exists
    if (!token) {
        return (
            <AuthLayout>
                <div className="lg:w-md w-full px-3 space-y-6">
                    <div className="bg-white/90 border border-red-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="space-y-1 text-sm sm:text-base text-red-800">
                                <p className="font-semibold">Invalid Link</p>
                                <p>The onboarding link is invalid or has expired. Please request a new invitation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    // Initialize formik
    const formik = useFormik({
        initialValues: {
            fullName: "",
        },
        validationSchema: onboardingValidationSchema,
        onSubmit: async (values: { fullName: string }) => {
            try {
                setIsLoading(true);
                setErrorMessage("");

                // Call the backend API with token and fullName
                const result = await partnerActions.completePartnerOnboarding({
                    partner_user: values.fullName,

                }, token,);

                if (result.success) {
                    // Store token for OTP verification
                    localStorage.setItem("onboarding_token", token);
                    localStorage.setItem("partner_email", result.data?.email || "");

                    // Navigate to OTP screen
                    navigate("/login/otp");
                } else {
                    setErrorMessage(
                        result.error || "Failed to complete onboarding. Please try again."
                    );
                }
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred"
                );
            } finally {
                setIsLoading(false);
            }
        },
    });

    return (
        <AuthLayout>
            <form onSubmit={formik.handleSubmit} className="w-full space-y-6">
                <div className="space-y-2">
                    <p className="text-2xl font-semibold text-slate-900">Partner onboarding</p>
                    <p className="text-sm text-slate-500">Tell us your legal name to activate your account.</p>
                </div>

                {/* Error message display */}
                {errorMessage && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-red-800 text-sm">{errorMessage}</p>
                    </div>
                )}

                <div className="w-full">
                    <DefaultTextInput
                        bdColor="#1d4ed8"
                        phColor="#94a3b8"
                        label="Full Name"
                        placeholder={'Clark Ukonu'}
                        value={formik.values.fullName}
                        setValue={(value: string) => formik.setFieldValue("fullName", value)}
                        error={
                            formik.touched.fullName && formik.errors.fullName
                                ? String(formik.errors.fullName)
                                : undefined
                        }
                        disabled={isLoading}
                    />
                </div>

                <DefaultButton
                    type={'submit'}
                    text={isLoading ? 'Processing...' : 'Complete onboarding'}
                    disabled={isLoading || !formik.isValid}
                />
            </form>
        </AuthLayout>
    );
};
