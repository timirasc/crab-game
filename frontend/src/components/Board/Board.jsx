function Board({
  board,
  currentPlayer,
  selectedCrab,
  availableMoves,
  isGameOver,
  onCrabClick,
  onMove,
}) {
  return (
    <div className="board">
      {board.map((row, rowIndex) =>
        row.map((cell, columnIndex) => {
          const isSelected =
            selectedCrab?.row === rowIndex &&
            selectedCrab?.column === columnIndex

          return (
            <div
              className="cell"
              key={`${rowIndex}-${columnIndex}`}
            >
              {cell && (
                <button
                  className={`crab crab--${cell} ${
                    isSelected ? 'crab--selected' : ''
                  }`}
                  type="button"
                  disabled={
                    isGameOver || cell !== currentPlayer
                  }
                  aria-label={`${cell} crab`}
                  onClick={() =>
                    onCrabClick(rowIndex, columnIndex, cell)
                  }
                />
              )}

              {isSelected &&
                availableMoves.map((move) => (
                  <button
                    className={
                      `move-arrow move-arrow--${move.name}`
                    }
                    type="button"
                    key={move.name}
                    aria-label={`Move ${move.name}`}
                    onClick={() => onMove(move)}
                  >
                    {move.symbol}
                  </button>
                ))}
            </div>
          )
        }),
      )}
    </div>
  )
}

export default Board