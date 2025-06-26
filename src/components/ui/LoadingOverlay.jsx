function LoadingOverlay({ message = "Chargement..." }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-light rounded-full animate-spin mb-4"></div>
      <p className="text-white font-bold">{message}</p>
    </div>
  );
}

export default LoadingOverlay;