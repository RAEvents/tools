import { Component } from "preact";
import * as css from "./tabarea.module.css";

export class TabArea extends Component {
    static Tab = function(props) {
        return props.name;
    }

    constructor() {
        super();
        this.state = { activeTab: 0 };
    }

    setActiveTab(n) {
        this.setState({ activeTab: n });
    }

    getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.activeTab == prevState.activeTab) {
            return null;
        } else {
            return { activeTab: nextProps.activeTab };
        }
    }

    render({ children, ...props }, state) {
        const tabs = children.filter(v => v.type == TabArea.Tab).map((v, i) => [i, v]);
        const content = tabs.map(v => [v[0], v[1].props.children]);

        return <div class={props.class}>
            <div class={css.bar}>
                {tabs.map(tab => (
                    <button key={tab[0]} 
                        onClick={() => this.setState({ activeTab: tab[0] })}
                        class={`${css.tab} ${tab[0] == state.activeTab ? css.active : ""}`}>
                        {tab[1]}
                    </button>
                ))}
            </div>
            <div class={css.content}>
                {content.map(content => (
                    <div key={content[0]} class={content[0] == state.activeTab ? css.active : ""}>
                        {content[1]}
                    </div>
                ))}
            </div>
        </div>;
    }
}
