declare module "qrcode" {
  const QRCode: {
    toDataURL(input: string): Promise<string>;
  };

  export default QRCode;
}
