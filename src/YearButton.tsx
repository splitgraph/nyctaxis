interface YearButtonProps {
  currentYear: number;
  targetYear: number;
  onClick: () => void;
  disabled: boolean;
}
const YearButton = ({ currentYear, targetYear, onClick, disabled }: YearButtonProps) => {
  return (
    <button style={{ fontWeight: currentYear === targetYear ? 'bold' : 'inherit' }}
      onClick={onClick} disabled={disabled}
    >
      {targetYear}
    </button>
  )
}
export default YearButton