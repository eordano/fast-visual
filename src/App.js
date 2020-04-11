import React, { useLayoutEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { combineLatest, fromEvent, merge, of } from "rxjs";
import { scan, switchMap } from "rxjs/operators";
import "./App.css";
import { connect$, listenOnConnect } from "./connection";
import { simpleLine } from "./simpleLine";

const formatNow = () => {
  const d = new Date().getUTCMinutes();
  const f = new Date().getUTCSeconds();
  const m = new Date().getUTCMilliseconds();
  return `${d}:${f}.${m}`;
};

const lastTen$ = ["ping", "gate", "dns"].map((name) =>
  listenOnConnect(name).pipe(
    scan((a, b) => {
      if (typeof a === "string") {
        return [[parseFloat(a.trim()), formatNow()]];
      }
      const value = b ? parseFloat(b.trim()) : undefined;
      if (!value) {
        return a;
      }
      return a
        .concat([[value, formatNow()]])
        .filter((_, index) => a.length - index < 30);
    })
  )
);

const eventNames = ["ping", "gate", "dns"];
const eventNames$ = of(eventNames);
combineLatest(connect$, eventNames$)
  .pipe(
    switchMap((value) => {
      const socket = value[0];
      const events = value[1];
      return merge(events.map((event) => fromEvent(socket, event)));
    })
  )
  .subscribe((a, b, c) => {
    console.log(a, b, c);
  });

function App() {
  const [a, setA] = useState([]);
  const [b, setB] = useState([]);
  const [c, setC] = useState([]);

  useLayoutEffect(() => {
    const sets = [setA, setB, setC];
    lastTen$.map(($, index) =>
      $.subscribe((_) => {
        const set = sets[index];
        if (!Array.isArray(_)) {
          return;
        }
        set(_);
      })
    );
  }, []);
  const noanim = {
    animation: {
      duration: 0.07,
    },
  };
  return (
    <div className="App">
      <header className="App-header">
        <Line
          options={noanim}
          data={simpleLine([a, b], { names: eventNames })}
        />
        <Line options={noanim} data={simpleLine([c], { names: ["dns"] })} />
      </header>
    </div>
  );
}

export default App;
