import { Fragment } from "react";

export default function RootLayout(props: Readonly<{
  modal: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <Fragment>
      {props.modal}
      {props.children}
    </Fragment>
  );
}
