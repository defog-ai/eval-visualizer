const Switch = ({
  checked,
  setChecked,
  uncheckedLabel, 
  checkedLabel
}) => {
  return (
    <p>
      {uncheckedLabel}
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
          onChange={() => setChecked(
            (prev) => !prev
          )} />
        <span className="slider round"></span>
      </label>
      {checkedLabel}
    </p>
  )
}

export default Switch