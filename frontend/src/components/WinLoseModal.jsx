import "./WinLoseModal.css";

const WinLoseModal = ({ isWin, onClose, message }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon ${isWin ? "win" : "lose"}`}>
          {isWin ? "🎉" : "😔"}
        </div>
        <h2 className={`modal-title ${isWin ? "win" : "lose"}`}>
          {isWin ? "Congratulations!" : "Try Again!"}
        </h2>
        <p className="modal-message">{message}</p>
        <button className="modal-close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default WinLoseModal;

