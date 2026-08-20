function MainMenu({ onPvpClick }) {
  return (
    <section className="main-menu">
      <div className="main-menu__buttons">
        <button
          className="main-menu__button tutorial"
          type="button"
          disabled
        >
          Обучение
        </button>

        <button
          className="main-menu__button single-game"
          type="button"
          disabled
        >
          Одиночная
        </button>

        <button
          className="main-menu__button pvp"
          type="button"
          onClick={onPvpClick}
        >
          PVP
        </button>

        <button
          className="main-menu__button settings"
          type="button"
          disabled
        >
          Настройки
        </button>

      </div>
    </section>
  )
}

export default MainMenu