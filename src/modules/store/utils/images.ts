interface IFormatImagesResponse {
  url: string;
  name: string;
}

export default function formatImages(
  images: string[],
): IFormatImagesResponse[] {
  if (images && images.length > 0) {
    const arrImages = images.map((img: string) => {
      if (process.env.STORAGE_DRIVER === 's3') {
        return {
          url: `https://images-all-products.s3.amazonaws.com/${img}`,
          name: img.split('_')[1],
        };
      }

      return {
        url: `${process.env.APP_API_URL}/images/${img}`,
        name: img.split('_')[1],
      };
    });

    return arrImages;
  }

  return [];
}
