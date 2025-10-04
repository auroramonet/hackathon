import { Layout } from "./components";
import "./App.css";
import Map from "./components/Map";

function App() {
  return (
    <Layout>
      <div className="app">
        <h1>Welcome to Your React App</h1>
        <p>Start building your amazing application here!</p>
        <Map />
      </div>
    </Layout>
  );
}

export default App;
