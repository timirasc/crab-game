import { BOARD_SIZE } from '../../game/constants'

function Board({
  board,
  currentPlayer,
  selectedCrab,
  availableMoves,
  isGameOver,
  onCrabClick,
  onMove,
}) {
  const crabs = board.flatMap((row, rowIndex) =>
    row.flatMap((crab, columnIndex) => {
      if (crab === null) return []

      return [
        {
          ...crab,
          row: rowIndex,
          column: columnIndex,
        },
      ]
    }),
  )

  return (
    <div className="board-scene">
      <div className="board">
        <div className="board-grid">
          {board.map((row, rowIndex) =>
            row.map((_, columnIndex) => {
              const isSelectedCell =
                selectedCrab?.row === rowIndex &&
                selectedCrab?.column === columnIndex

              return (
                <div
                  className="cell"
                  key={`${rowIndex}-${columnIndex}`}
                >
                  {isSelectedCell &&
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
                      </button>
                    ))}
                </div>
              )
            }),
          )}

          <div className="crab-layer">
            {crabs.map((crab) => {
              const isSelected =
                selectedCrab?.id === crab.id

              const left =
                ((crab.column + 0.5) / BOARD_SIZE) * 100

              const top =
                ((crab.row + 0.5) / BOARD_SIZE) * 100

              return (
                <button
                  className={`crab crab--${crab.color} ${
                    isSelected ? 'crab--selected' : ''
                  }`}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                  }}
                  type="button"
                  key={crab.id}
                  disabled={
                    isGameOver ||
                    crab.color !== currentPlayer
                  }
                  aria-label={`${crab.color} crab`}
                  onClick={() =>
                    onCrabClick(
                      crab.row,
                      crab.column,
                      crab,
                    )
                  }
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Board