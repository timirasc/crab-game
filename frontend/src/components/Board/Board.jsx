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
  .sort((firstCrab, secondCrab) =>
    firstCrab.id.localeCompare(secondCrab.id),
  )

  return (
    <div className="board-scene">
      <div className="board">
        <div className="board-grid">
          {board.map((row, rowIndex) =>
              row.map((crab, columnIndex) => {
              const isSelectedCell =
                selectedCrab?.row === rowIndex &&
                selectedCrab?.column === columnIndex

              return (
                <div
                  className="cell"
                  key={`${rowIndex}-${columnIndex}`}
                >
                  {crab !== null && (
                    <button
                      className="crab-hitbox"
                      type="button"
                      disabled={
                        isGameOver ||
                        crab.color !== currentPlayer
                      }
                      aria-label={`${crab.color} crab`}
                      onClick={() =>
                        onCrabClick(
                          rowIndex,
                          columnIndex,
                          crab,
                        )
                      }
                    />
                  )}

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
                      />
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
                <div
                  className={`crab-piece ${
                    isSelected ? 'crab-piece--selected' : ''
                  }`}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    zIndex: crab.row + 2,
                  }}
                  key={crab.id}
                  aria-hidden="true"
                >
                  <span className="crab__visual">
                    <img
                      className="crab__sprite-sheet"
                      src={
                        crab.color === 'blue'
                          ? '/images/crabs/Crab-blue-animation.png'
                          : '/images/crabs/Crab-red-animation.png'
                      }
                      alt=""
                      draggable="false"
                    />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Board