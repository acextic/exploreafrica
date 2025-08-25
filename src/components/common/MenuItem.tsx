import React from "react";
import classNames from "classnames";

type Props = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  hint?: string;
};

const MenuItem: React.FC<Props> = ({
  icon,
  label,
  onClick,
  disabled,
  destructive,
  hint,
}) => {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left",
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : destructive
          ? "text-red-600 hover:bg-red-50"
          : "hover:bg-gray-50"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </button>
  );
};

export default MenuItem;
