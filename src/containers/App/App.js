import React, { Component } from "react";
import * as Sentry from "@sentry/browser";
import { Switch, Route } from "react-router-dom";
import { withRouter } from "react-router";

import CallIn from "../CallIn/CallIn";
import Landing from "../Landing/Landing";
import SignUp from "../SignUp/SignUp";
import SignUpThankYou from "../SignUp/ThankYou/ThankYou";
import CallThankYou from "../CallIn/ThankYou/ThankYou";
import ScrollToTop from "../ScrollToTop/ScrollToTop";

import { initAmplitude, logPageView } from "../../util/amplitude";

import styles from "./App.module.css";

class App extends Component {
  constructor(props) {
    super(props);
    initAmplitude();
    Sentry.init({
      dsn: "https://a5fc08e12a1744ddacc396ce79e034f2@sentry.io/1462422",
      release: process.env.REACT_APP_SENTRY_RELEASE,
    });
  }

  state = {
    previousLocation: null,
  };

  pageWasViewed(location) {
    console.log('pwv')
    if (
      !this.state.previousLocation ||
      location.pathname !== this.state.previousLocation.pathname
    ) {
      console.log('pwv2')
      logPageView(location.pathname);
      this.setState({ previousLocation: location });
    }
  }

  componentDidMount() {
    console.log('cdm')
    console.log(this.props.history.location)
    this.pageWasViewed(this.props.location);
  }

  componentDidUpdate(prevProps) {
    console.log('cdu')
    console.log(this.props.history.location)
    if (this.props.location !== prevProps.location) {
      this.pageWasViewed(this.props.location);
    }
  }

  render() {
    return (
      <ScrollToTop>
        <div className={styles.App}>
          <Switch>
            <Route path="/" exact component={Landing} />
            <Route path="/signup/thankyou" component={SignUpThankYou} />
            <Route path="/signup" component={SignUp} />
            <Route path="/call/thankyou" component={CallThankYou} />
            <Route path="/call" component={CallIn} />
            <Route
              render={() => {
                return <h2>404</h2>;
              }}
            />
          </Switch>
        </div>
      </ScrollToTop>
    );
  }
}

export default withRouter(App);
export { App };
