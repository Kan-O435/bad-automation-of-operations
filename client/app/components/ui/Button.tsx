type Props = {
  text: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

export const Button = ({ text, onClick, type = "button", className = "" }: Props) => (
  <button
    type={type}
    onClick={onClick}
    className={`w-full bg-[#1a1a1a] text-white py-4 font-bold hover:opacity-90 transition-opacity ${className}`}
  >
    {text}
  </button>
);