import React from "react";

const LabelledInput = ({
  type,
  identifier,
  content,
  placeholder,
  value,
  onChange,
}) => {
  return (
    <label htmlFor={identifier} className="flex flex-col gap-2 w-full">
      <span className="text-base font-semibold text-white">{content}</span>
      <input
        type={type}
        name={identifier}
        id={identifier}
        autoComplete="off"
        placeholder={placeholder}
        className="bg-stone-600 rounded p-2 text-white w-full text-xl"
        value={value}
        onChange={onChange}
        required
      />
    </label>
  );
};

export default LabelledInput;
