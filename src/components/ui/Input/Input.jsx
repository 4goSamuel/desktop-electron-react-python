import "./Input.css";

function Input({
  icon,
  rightIcon,
  onRightIconClick,
  type = "text",
  placeholder,
  value,
  onChange,
  ...rest
}) {
  return (
    <div className="input">

      {icon && (
        <span className="input-icon">
          {icon}
        </span>
      )}

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...rest}
      />

      {rightIcon && (
        <button
          type="button"
          className="input-right"
          onClick={onRightIconClick}
        >
          {rightIcon}
        </button>
      )}

    </div>
  );
}

export default Input;