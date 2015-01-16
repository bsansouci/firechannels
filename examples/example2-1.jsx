var channel = chan("channel1");
var channel2 = chan("channel2");

var App = React.createClass({
  getInitialState: function() {
    return {text: "Hey"};
  },

  componentDidMount: function () {
    channel.getAll(function(s) {
      this.setState(s);
      channel2.put(this.state.text + this.state.count);
    }.bind(this));
  },
  render: function() {
    return (
      <div id="main">
        {this.state.text + " " + this.state.count}
      </div>
    );
  }
});

React.render(<App />, document.getElementById("react"));
