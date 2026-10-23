import "./Button.css";
import { LoaderCircle } from "lucide-react";

function Button({
    children,
    className = "",
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onClick,
    type = "button"
}) {

    return (

        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`
                app-button
                app-button-${variant}
                app-button-${size}
                ${fullWidth ? "app-button-full" : ""}
                ${className}
            `}
        >

            {loading ? (

                <LoaderCircle
                    className="app-spin"
                    size={18}
                />

            ) : (

                <>
                    {LeftIcon && <LeftIcon size={18} />}

                    <span>{children}</span>

                    {RightIcon && <RightIcon size={18} />}
                </>

            )}

        </button>

    );

}

export default Button;