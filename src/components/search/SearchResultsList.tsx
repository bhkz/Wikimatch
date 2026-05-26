import { motion } from "motion/react";
import { useCustomSearch } from "./SearchContext";
import SearchResultCard from "./SearchResultCard";

export default function SearchResultsList() {
  const { results } = useCustomSearch();

  return (
    <div className="flex flex-col gap-6">
      {results.map((res, i) => (
        <motion.div
          key={res.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
        >
          <SearchResultCard item={res} />
        </motion.div>
      ))}
    </div>
  );
}
