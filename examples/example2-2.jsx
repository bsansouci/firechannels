var channel = chan("channel1");
var channel2 = chan("channel2");

var App = React.createClass({
  getInitialState: function() {
    return {
      text: "Hey",
      count: 0,
      subState: {
        text: "Hey",
        count: 0
      }
    };
  },
  componentDidMount: function () {
    channel.put(this.state);
    channel2.getAll(function(s) {
      this.setState({
        subState: s
      });
    }.bind(this));
  },
  onClick: function(v) {
    var obj = {
      count: this.state.count + 1
    };
    this.setState(obj);
    channel.put(obj);
  },
  render: function() {
    return (
      <div id="main">
        Local: {this.state.text + " " + this.state.count}
        <br />
        Confirmation: {this.state.subState.text + " " + this.state.subState.count}
        <br />
        <button onClick={this.onClick}>Click me!</button>
      </div>
    );
  }
});

React.render(<App />, document.getElementById("react"));