import React from "react";
import PageStateCard from "./PageStateCard";

export default class RenderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("RenderErrorBoundary caught an error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <PageStateCard
          eyebrow="Runtime Error"
          title="The page failed to render"
          description={this.state.error?.message || "An unknown render error occurred."}
        />
      );
    }

    return this.props.children;
  }
}
