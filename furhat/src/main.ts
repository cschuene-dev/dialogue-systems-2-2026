import { setup, createActor, fromPromise, assign } from "xstate";

const FURHATURI = "127.0.0.1:54321";

type DMContext = {
  lastUtterance: string | undefined,
}

async function fhVoice(name: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encName = encodeURIComponent(name);
  return fetch(`http://${FURHATURI}/furhat/voice?name=${encName}`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function fhSay(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encText = encodeURIComponent(text);
  return fetch(`http://${FURHATURI}/furhat/say?text=${encText}&blocking=true`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function fhGetUser() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/users`, {
    method: "GET",
    headers: myHeaders,
  });
}

async function fhAttend() {
  const myHeaders = new Headers();
  myHeaders.append("accept","application/json");
    return fetch(`http://${FURHATURI}/furhat/attend?user=CLOSEST`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({enum: "CLOSEST"}),
  });
}

async function newGesture() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "newGesture",
      frames: [
        {
          time: [], //ADD THE TIME FRAME OF YOUR LIKING
          persist: true,
          params: {
            //ADD PARAMETERS HERE IN ORDER TO CREATE A GESTURE
          },
        },
        {
          time: [], //ADD TIME FRAME IN WHICH YOUR GESTURE RESETS
          persist: true,
          params: {
            reset: true,
          },
        },
        //ADD MORE TIME FRAMES IF YOUR GESTURE REQUIRES THEM
      ],
      class: "furhatos.gestures.Gesture",
    }),
  });
}

async function fhGesture(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(
    `http://${FURHATURI}/furhat/gesture?name=${text}&blocking=true`,
    {
      method: "POST",
      headers: myHeaders,
      body: "",
    },
  );
}

async function fhLEDLight(green: number) {
  const myHeaders = new Headers();
  const encText = encodeURIComponent(green);
  return fetch(`http://${FURHATURI}/furhat/led?green=${encText}`,{
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function fhListen() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/listen`, {
    method: "GET",
    headers: myHeaders,
  })
    .then((response) => response.body)
    .then((body) => body.getReader().read())
    .then((reader) => reader.value)
    .then((value) => JSON.parse(new TextDecoder().decode(value)).message);
}

const dmMachine = setup({
  types: {
    context: {} as DMContext,
  },
  actors: {
    fhVoice: fromPromise<any, null>(async () => {
      return fhVoice("en-US-EchoMultilingualNeural");
    }),
    fhHello: fromPromise<any, null>(async () => {
      await fhLEDLight(225);
      await fhGesture("Smile");
      await fhSay("Hallo!");
      await fhLEDLight(0);
      return fhSay("Hi");
    }),
    fhLEDLight: fromPromise<any, null> (async()=> {
      return fhLEDLight(255);
    }),
    fhL: fromPromise<any, null>(async () => {
      await fhLEDLight(0);
      await new Promise(resolve => setTimeout(resolve, 300));
      const utterance = await fhListen();
      await fhLEDLight(255);
     return utterance;
   }),
   fhS: fromPromise<any, string>(async ({input}) => {
      await fhLEDLight(255);
      await fhSay(input);
      await fhLEDLight(255);
      return fhSay(input);
   }),
    fhGetUser: fromPromise<any, null>(async () => {
     return fhGetUser();
  }),
    fhAttend: fromPromise<any, null>(async () => {
      return fhAttend();
  }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcD2qAuA6AyhghshgMQAesBGYW+AZlcgBQCMADOwJTFqa4FEBtVgF1EoAA6pYASwzTUAOzEhSiZgGYATFmYBWAGybd69QA5NpgJzMALABoQATzXNTWAOyb9B-e-fr3G0DNAF8Qhx5sADkwUhIIRWppBQA3VABrakisGLiEZLSAY3w5RSFhcuVJGVKlJBVEGwsPJs02fVZNG0tfB2cEU2YsXXZWPQDLd311GxswiPRo2JIwZDRkLHEAGxLaVGQAWyxs3Ix81NRi2vLK+urZeTrQVQQmt2C21g6unvc+tUCWEsxg0uiszFsRl0YXCIAUqAgcGUkSqUgeimULwAtPp-ggcfMQNk8IQMKiao9MY1NHiIe4PF5dEz9PoeqwpupCSdluT0U8GggjOosB09FNBh19LZTHjLDYsJpGZZWLomq5DJzYdkADLSChgfn3WpUhBgoamXTMDpjZXqSZ-JxqVjCoLeAJMtg2Gb6LmLLAAMXw0i2vON9ReZqwFqt7GYtvttJ6QM0k1Ylk0XwsNlsMJCQA */
  id: "root",
  context: {
    lastUtterance: undefined,
  },
  initial: "Start",
  states: {
    Start: { 
      invoke: {
        src: "fhLEDLight",      
        input: null,
        onDone: {
          target: "Delay",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },
    Delay: {after: {1000: "Greeting"}},
    Greeting:{
      invoke: {
        src:"fhHello",
        input: null,
        onDone: {
          target:"GetUser",
          actions: ({event}) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({event}) => console.log(event),
        },
      },
    },
    Speak:{
      invoke: {
        src:"fhS",
        input: ({context}) => context.lastUtterance as string,
        onDone: {
          target:"GetUser",
          actions: ({event}) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({event}) => console.log(event),
        },
      },
    },
    GetUser:{
      invoke: {
        src:"fhGetUser",
        input: null,
        onDone: {
          target:"Attend",
          actions: ({event}) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({event}) => console.error(event),
        },
      },
    },
    Attend:{
      invoke: {
        src:"fhAttend",
        input: null,
        onDone: {
          target:"Listen",
          actions: ({event}) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({event}) => console.error(event),
        },
      },
    },
    Listen: {
      invoke: {
        src: "fhL",
        input: null,
        onDone: {
          target: "Speak",
          actions: [
            ({event}) => console.log(event.output),
            assign({lastUtterance: ({event}) => event.output})]
        },
          onError: {
            target: "Fail",
            actions: ({event}) => console.error(event),
        },
      },
    },
    Fail: {},
    Done: {},
  },
});

const actor = createActor(dmMachine).start();
console.log(actor.getSnapshot().value);

actor.subscribe((snapshot) => {
  console.log(snapshot.value);
});

