import Ember from 'ember';
import d3 from 'd3';
import layout from './template';

import EmberD3 from '../../mixins/d3-support';

import { join } from '../../utils/d3';

import { box } from '../../utils/css';

export default Ember.Component.extend(EmberD3, {
  layout,

  stroke: d3.scale.category10(),

  contentWidth: Ember.computed('width', 'margin.left', 'margin.right', {
    get() {
      var width = this.get('width');
      var left = this.get('margin.left');
      var right = this.get('margin.right');

      return width - left - right;
    }
  }).readOnly(),
  contentHeight: Ember.computed('height', 'margin.top', 'margin.bottom', {
    get() {
      var height = this.get('height');
      var top = this.get('margin.top');
      var bottom = this.get('margin.bottom');

      return height - top - bottom;
    }
  }).readOnly(),

  defaultMargin: { left: 50, right: 0, top: 0, bottom: 50 },
  margin: box.asComputed('defaultMargin'),
  orient: null, // TODO

  model: null,

  width: 300,
  height: 150,

  exportedXScale: null,
  computedXScale: Ember.computed('contentWidth', 'model.data', 'model.key', {
    get() {
      var width = this.get('contentWidth');
      var data = this.get('model.data');
      var key = this.get('model.key');
      var domain, scale;

      domain = !key ? data : d3.extent(data, record => Ember.get(record, key));
      domain = domain.length ? domain : [ 0, 1 ];

      scale = domain.reduce(((prev, cur) => prev && cur instanceof Date), true);
      scale = scale ? d3.time.scale() : d3.scale.linear();

      return scale.domain(domain).range([ 0, width ]);
    }
  }).readOnly(),
  exportedYScale: null,
  computedYScale: Ember.computed('contentHeight', 'model.extent', {
    get() {
      var height = this.get('contentHeight');
      var extent = this.get('model.extent');

      extent[0] = Math.min(extent[0], 0);
      extent[1] = Math.max(extent[1], 0);

      if (extent[0] === extent[1]) {
        extent[1]++;
      }

      return d3.scale.linear()
        .domain(extent)
        .range([ 0, -height ]);
    }
  }).readOnly(),

  call(sel) {
    var context = this;
    var top = this.get('margin.top');
    var left = this.get('margin.left');
    var height = this.get('contentHeight');
    var elementId = context.elementId;

    sel.each(function () {
      context.series(d3.select(this).attr('id', elementId).attr('transform', `translate(${left} ${top + height})`));
    });
  },

  series: join('model.series', '.series', {
    enter(sel) {
      sel
        .append('g')
          .attr('class', 'series')
        .append('path');
    },

    update(sel) {
      var self = this;
      var data = this.get('model.data');
      var key = this.get('model.key');
      var xScale = this.get('computedXScale');
      var yScale = this.get('computedYScale');

      var color = this.get('stroke');

      sel
        .style('stroke', ({ metricPath }) => color(metricPath))
        .each(function (series) {
          var path = d3.transition(d3.select(this)
              .select('path').datum(data)
            .style('fill', 'none')
            .style('stroke-width', 5));

          if (path.delay && path.duration) {
            d3.transition(path)
              .style('opacity', 0)
              .each('end', function () {
                self.set('exportedXScale', xScale);
                self.set('exportedYScale', yScale);

                d3.select(this)
                    .attr('d', d3.svg.line()
                      .x(record => xScale(record[key]))
                      .y(record => yScale(Ember.get(record, series.metricPath)))
                    )
                  .transition()
                    .style('opacity', 1)
                    .styleTween('stroke-dasharray', function dashTween() {
                      var total = this.getTotalLength();
                      var interp = d3.interpolateString(`0,${total}`, `${total},${total}`);

                      return (time) => interp(time);
                    });
              });
          }
        });
    }
  })
});
