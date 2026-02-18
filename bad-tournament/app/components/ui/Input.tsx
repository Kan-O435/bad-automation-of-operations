type Props = {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
};

export const Input = ({ label, type = "text", value, onChange, required }: Props) => (
  <div>
    <label className="block text-sm font-bold mb-2 text-black">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black text-black"
    />
  </div>
);