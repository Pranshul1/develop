import React, { useState, useContext, useRef, useEffect } from "react";

// human readable versions of names
const LANGUAGES = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  html: "HTML",
  coffee: "CoffeeScript",
  powershell: "PowerShell",
  json: "JSON",
  cpp: "C++",
  csharp: "C#",
  es6: "JavaScript (ES6)",
  yml: "YAML",
  yaml: "YAML",
};

export const CodeContext = React.createContext(null);

// only fetch them once
let cachedCodeKeywords = null;

export function useCodeContextState(fetcher) {
  let [codeKeywords, setCodeKeywords] = useState(null);
  if (codeKeywords === null && cachedCodeKeywords !== null) {
    setCodeKeywords(cachedCodeKeywords);
    codeKeywords = cachedCodeKeywords;
  }

  useEffect(() => {
    if (cachedCodeKeywords === null) {
      fetcher().then((config) => {
        cachedCodeKeywords = config;
        setCodeKeywords(config);
      });
    }
  });

  return {
    codeKeywords,
    sharedCodeSelection: useState(null),
    sharedKeywordSelection: useState({}),
  };
}

function CodeTabs({ children, hideTabBar = false }) {
  if (!Array.isArray(children)) {
    children = [children];
  } else {
    children = [...children];
  }

  children.sort((a, b) => {
    function makeKey({ language, title }) {
      return `${language || "_"}-${title || ""}`;
    }
    return makeKey(a.props).localeCompare(makeKey(b.props), ["en"], {
      sensitivity: "base",
    });
  });

  // the idea here is that we have two selection states.  The shared selection
  // always wins unless what is in the shared selection does not exist on the
  // individual code block.  In that case the local selection overrides.  The
  // final selection is what is then rendered.

  const codeContext = useContext(CodeContext);
  const [sharedSelection, setSharedSelection] = codeContext.sharedCodeSelection;
  const [localSelection, setLocalSelection] = useState(null);
  const [lastScrollOffset, setLastScrollOffset] = useState(null);
  const tabBarRef = useRef(null);

  // The title is what we use for sorting and also for remembering the
  // selection.  If there is no title fall back to the title cased language
  // name (or override from `LANGUAGES`).
  let possibleChoices = children.map((x) => {
    const { title, language } = x.props;
    return (
      title ||
      LANGUAGES[language] ||
      (language ? language[0].toUpperCase() + language.substr(1) : "Text")
    );
  });

  // disambiguate duplicates by enumerating them.
  const tabTitleSeen = {};
  possibleChoices = possibleChoices.reduce((arr, tabTitle) => {
    if (possibleChoices.filter((x) => x === tabTitle).length > 1) {
      const num = (tabTitleSeen[tabTitle] = (tabTitleSeen[tabTitle] || 0) + 1);
      arr.push(`${tabTitle} ${num}`);
    } else {
      arr.push(tabTitle);
    }
    return arr;
  }, []);

  const sharedSelectionChoice = sharedSelection
    ? possibleChoices.find((x) => x === sharedSelection)
    : null;
  const localSelectionChoice = localSelection
    ? possibleChoices.find((x) => x === localSelection)
    : null;

  const finalSelection =
    sharedSelectionChoice || localSelectionChoice || possibleChoices[0];

  // Whenever local selection and the final selection are not in sync, the local
  // selection is updated from the final one.  This means that when the shared
  // selection moves to something that is unsupported by the block it stays on
  // its last selection.
  if (localSelection !== finalSelection) {
    setLocalSelection(finalSelection);
  }

  let code = null;

  // When the selection switches we scroll so that the box that was toggled
  // stays scrolled like it was before.  This is because boxes above the changed
  // box might also toggle and change height.
  useEffect(() => {
    if (lastScrollOffset !== null) {
      const diff =
        tabBarRef.current.getBoundingClientRect().y - lastScrollOffset;
      window.scroll(window.scrollX, window.scrollY + diff);
      setLastScrollOffset(null);
    }
  }, [lastScrollOffset]);

  const names = possibleChoices.map((choice, idx) => {
    const isSelected = choice === finalSelection;
    if (isSelected) {
      code = children[idx];
    }

    return (
      <button
        className={isSelected ? "active" : ""}
        onClick={() => {
          // see useEffect above.
          setLastScrollOffset(tabBarRef.current.getBoundingClientRect().y);
          setSharedSelection(choice);
          setLocalSelection(choice);
        }}
        key={idx}
      >
        {choice}
      </button>
    );
  });

  return (
    <div className="code-tabs" ref={tabBarRef}>
      {!hideTabBar && <div className="tab-bar">{names}</div>}
      <div className="tab-content">{code}</div>
    </div>
  );
}

export default CodeTabs;
