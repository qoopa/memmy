import React from "react";
import NoResultView, { INoResultViewProps } from "../common/NoResultView";

function NoPostsView({ ...props }: INoResultViewProps) {
  return (
    <NoResultView
      message="No posts found. Maybe you should get a conversation started?"
      {...props}
    />
  );
}

export default NoPostsView;
