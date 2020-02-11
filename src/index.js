import React from "react";
import ReactDOM from "react-dom";

import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";

import {
  listInputRules,
  linksInputRules,
  blocksInputRule,
  baseKeyMaps,
  textFormattingInputRules
} from "./plugins";

import { MarkdownTransformer } from "./schmea/markdown/transformer";
import { MarkdownSerializer } from "./schmea/markdown/serializer";

import schema from "./schmea";

import "./styles.css";

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.container = React.createRef();
    this.state = {
      focus: this.props.focus || false
    };
  }
  componentDidMount() {
    const { props } = this;
    try {
      const state = EditorState.create({
        doc: new MarkdownTransformer(props.schema).parse(props.value),
        plugins: [
          history(),
          baseKeyMaps(props.schema),
          blocksInputRule(props.schema),
          textFormattingInputRules(props.schema),
          linksInputRules(props.schema),
          listInputRules(props.schema)
        ]
      });
      const view = new EditorView(this.container, {
        state,
        dispatchTransaction(transaction) {
          const { state, transactions } = view.state.applyTransaction(
            transaction
          );
          if (
            transactions.some(tr => tr.docChanged) &&
            props.onChange &&
            typeof props.onChange === "function"
          ) {
            const markdown = MarkdownSerializer.serialize(state.doc);
            props.onChange(markdown);
          }
          view.updateState(state);
        }
      });
      if (this.state.focus) {
        console.log("focus", this.state.focus);
        view.focus();
      }
      this.view = view;
    } catch (e) {
      console.log(e.stack);
    }
  }
  render() {
    return <div className="zelus-editor" ref={el => (this.container = el)} />;
  }
}
const initialValue = `# Markdown editor

## Subheading

### Triple heading

#### Forth heading

##### Fifth heading

We can do \`code\`, **bold**, _italics_ or ~~strikethrough~~

\`\`\`
Code block? 
Of course
\`\`\`

> Quotation block? I gotcha 

3 reasons to try this:
1. Automatic
2. Numeric
3. Lists

Guess what?
* Bullet
* Points
  * With indentation
  * Too

And to "closedown" check out auto-linking www.workast.com`;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      content: initialValue
    };
  }
  onChange = content => {
    this.setState({
      content
    });
  };
  render() {
    return (
      <div className="App">
        <div className="edit">
          <p>Editor WYSIWYG</p>
          <Editor
            schema={schema}
            value={initialValue}
            onChange={this.onChange}
          />
        </div>
        <div className="markdown">
          <p>Markdown Preview</p>
          <textarea disabled value={this.state.content} />
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
