interface IFormatVariantsWithPrice {
  name: string;
  price: number;
  priceString: string;
  oldPriceString: string;
}

interface IColor {
  name: string;
}

interface IPrice {
  name: string;
  price: number;
  priceString: string;
}

interface IFormatVariantsResponse {
  // eslint-disable-next-line
  [key: string]: any;
}

interface IVariants {
  color: string;
  size: string;
  model: string;
}

function formatVariantsWithPrice(
  value: string,
  discountDefault: number,
): IFormatVariantsWithPrice {
  const valueArrSplitted = value.split('- ');

  return {
    name: valueArrSplitted[0].replace(' ', ''),
    price: Number(valueArrSplitted[1]),
    priceString: Number(valueArrSplitted[1]).toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    }),
    oldPriceString: (
      Number(valueArrSplitted[1]) + discountDefault
    ).toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    }),
  };
}

export default function formatVariants(
  variantsArr: IVariants[],
  discountDefault: number,
): IFormatVariantsResponse {
  if (variantsArr.length > 0) {
    const newColor: IColor[] = [];
    const newSize: IPrice[] = [];
    const newModel: IPrice[] = [];

    variantsArr.forEach((variants: IVariants) => {
      if (variants.color) {
        const colorSplitted = variants.color.split('; ');

        const nameColorArr = colorSplitted.map((value: string) => {
          return { name: value };
        });

        newColor.push(...nameColorArr);
      }

      if (variants.size) {
        const sizeSplitted = variants.size.split('; ');

        newSize.push(
          ...sizeSplitted.map((value: string) => {
            return formatVariantsWithPrice(value, discountDefault);
          }),
        );
      }

      if (variants.model) {
        const modelSplitted = variants.model.split('; ');

        newModel.push(
          ...modelSplitted.map((value: string) => {
            return formatVariantsWithPrice(value, discountDefault);
          }),
        );
      }
    });

    return {
      color: [...newColor],
      size: [...newSize],
      model: [...newModel],
    };
  }

  return [];
}
