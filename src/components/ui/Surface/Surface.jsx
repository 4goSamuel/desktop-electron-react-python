import "./Surface.css";

function Surface({
    children,
    className = "",
    hover = false
}) {

    return (
        <section
            className={`
                app-surface
                ${hover ? "app-surface-hover" : ""}
                ${className}
            `}
        >
            {children}
        </section>
    );

}

export default Surface;