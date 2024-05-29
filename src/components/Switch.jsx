const Switch = ({
  checked,
  onChangeFunction,
}) => {
  return (
    <p>
      Formatted Query
      <label className="switch" style={{
        marginBottom: -8,
        marginLeft: 5,
        marginRight: 5,
      }}>
        <input
          type="checkbox"
          className="slider"
          id="detail-button"
          checked={checked}
          onChange={() => onChangeFunction(
            (prev) => !prev
          )} />
        <span className="slider round"></span>
      </label>
      Probabilities
    </p>
  )
}

export default Switch