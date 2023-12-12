export const toBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString() ?? "");
    reader.onerror = (error) => reject(error);
  });
};

export const extractBase64AndType = (base64: string) => {
  const base64Data = Buffer.from(
    base64.replace(/^data:image\/\w+;base64,/, ""),
    "base64",
  );

  const type = base64.split(";")[0].split("/")[1];
  return { base64Data, type };
};
