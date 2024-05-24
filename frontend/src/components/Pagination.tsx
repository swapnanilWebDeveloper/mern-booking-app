export type Props = {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({ page, pages, onPageChange }: Props) => {
  const pageNumbers = [];
  for (let i = 1; i <= pages; i++) {
    pageNumbers.push(i);
  }
  return (
    <div className="flex justify-center">
      <div className="flex border border-slate-300">
        {pageNumbers.map((number) => (
          <li
            className={`list-none px-2 py-1 ${
              page === number ? "bg-gray-200" : ""
            }`}
          >
            <button onClick={() => onPageChange(number)}>{number}</button>
          </li>
        ))}
      </div>
    </div>
  );
};

export default Pagination;
