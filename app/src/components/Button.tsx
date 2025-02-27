interface ButtonProps {
  disabled?: boolean;
  onClick?: () => void; // Function to handle click events
  text: string; // Text to display on the button
}

const Button: React.FC<ButtonProps> = ({ disabled = false, onClick, text }: ButtonProps) => {
  return (
    <button disabled={disabled} onClick={onClick} className="text-orange-100 disabled:text-orange-100/50  p-2 text-sm rounded bg-orange-500 cursor-pointer">
      {text}
    </button>
  );
};

export default Button;
