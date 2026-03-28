function Button({ text }) {
  return (
    <button className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-800 shadow-sm">
      {text}
    </button>
  );
}

export default Button;
