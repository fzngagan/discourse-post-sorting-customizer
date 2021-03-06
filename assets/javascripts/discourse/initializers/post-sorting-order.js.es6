import { withPluginApi } from "discourse/lib/plugin-api";
import { h } from "virtual-dom";
import { ajax } from "discourse/lib/ajax";
import cookie from "discourse/lib/cookie";

export default {
  name: "post-sorting-order",
  initialize() {
    withPluginApi("0.8.7", postSortingOrder);
  }
};

const postSortingOrder = api => {
  api.decorateWidget("post:after", helper => {
    let model = api._lookupContainer("controller:topic").model;
    const isPrivateMessage = model.isPrivateMessage;
    if (
      helper.attrs.firstPost == true &&
      helper.attrs.topicPostsCount > 0 &&
      !isPrivateMessage
    ) {
      return helper.attach("post-sorting-buttons");
    }
  });

  api.createWidget("post-sorting-buttons", {
    tagName: "div.post-sorting-buttons-widget",
    html() {
      const buttons = [];
      const user = api.getCurrentUser();
      let highlighted;
      if (user && user.post_tab) {
        highlighted = user.post_tab;
      } else {
        highlighted = cookie("post_tab");
      }

      // MessageBus.subscribe("/post-sort-update", function(data) {
      //   user.post_tab = data.post_tab;
      // });

      buttons.push(
        this.attach("flat-button", {
          action: "sortByActive",
          className: `btn-large ${highlighted == "active" ? "selected" : ""}`,
          label: "post_sorting_buttons.active"
        })
      );

      buttons.push(
        this.attach("flat-button", {
          action: "sortByOldest",
          className: `btn-large ${highlighted == "oldest" ? "selected" : ""}`,
          label: "post_sorting_buttons.oldest"
        })
      );

      buttons.push(
        this.attach("flat-button", {
          action: "sortByLikes",
          className: `btn-large ${highlighted == "likes" ? "selected" : ""}`,
          label: "post_sorting_buttons.likes"
        })
      );
      return h("span", buttons);
    },

    sortBy(post_tab) {
      let topicController = api._lookupContainer("controller:topic");
      const user = api.getCurrentUser();
      if (!user) {
        cookie("post_tab", post_tab);
        debugger;
        topicController.set("post_tab", post_tab);
      } else {
        ajax("/post-tab", {
          type: "GET",
          data: { post_tab: post_tab }
        }).then(() => {
          topicController.set("post_tab", post_tab);
          user.post_tab = post_tab;
        });
      }
    },

    sortByActive() {
      this.sortBy("active");
    },

    sortByOldest() {
      this.sortBy("oldest");
    },

    sortByLikes() {
      this.sortBy("likes");
    }
  });

  api.modifyClass("controller:topic", {
    queryParams: ["filter", "username_filters", "post_tab"],
    post_tab: "oldest"
  });

  api.modifyClass("route:topic", {
    queryParams: {
      filter: { replace: true },
      username_filters: { replace: true },
      post_tab: { refreshModel: true }
    }
  });
};
