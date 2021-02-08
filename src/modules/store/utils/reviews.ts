export default function countRangeParcentage(
  reviews: any[],
  numberStar: number,
): number {
  const allReviewsRange = reviews.length;

  const countRange = reviews.filter((item) => item.stars === numberStar);

  return countRange.length > 0
    ? (countRange.length * 100) / allReviewsRange
    : 0;
}
