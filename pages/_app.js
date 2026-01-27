import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Header />
      <main style={styles.main}>
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  );
}

const styles = {
  main: {
    minHeight: "80vh",
    backgroundColor: "#020617",
  },
};
