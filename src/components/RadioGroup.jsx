import React from "react";

const RadioGroup = ({
  name,
  legend,
  options = [],
  accentColor = "accent-blue-600",
  value,
  onChange,
}) => {
  return (
    <fieldset className="flex flex-col gap-4 w-full">
      <legend className="text-base font-semibold text-white mb-2">
        {legend}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          htmlFor={option.value}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            id={option.value}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className={`${
              option.accentColor || accentColor
            } hover:scale-125 transition-transform duration-150 cursor-pointer`}
          />
          <span className="text-white text-xl">{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
};

export default RadioGroup;
