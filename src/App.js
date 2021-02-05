/* eslint-disable react-hooks/exhaustive-deps */
import MomentUtils from '@date-io/moment';
import { Animation } from '@devexpress/dx-react-chart';
import {
  ArgumentAxis, Chart,
  Legend, LineSeries,
  Title, ValueAxis
} from '@devexpress/dx-react-chart-material-ui';
import { Plugin } from "@devexpress/dx-react-core";
import { Backdrop, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Paper, Select } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import {
  KeyboardDatePicker, MuiPickersUtilsProvider
} from '@material-ui/pickers';
import axios from 'axios';
import moment from 'moment';
import React, { useEffect, useState } from 'react';


const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1), 
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  chart: {
    paddingRight: '20px',
  },
  title: {
    whiteSpace: 'pre',
  },
}));
const format = () => tick => tick;
const legendStyles = () => ({
  root: {
    display: 'flex',
    margin: 'auto',
    flexDirection: 'row',
  },
});
const legendLabelStyles = theme => ({
  label: {
    paddingTop: theme.spacing(1),
    whiteSpace: 'nowrap',
  },
});
const legendItemStyles = () => ({
  item: {
    flexDirection: 'column',
  },
});

//
const legendRootBase = ({ classes, ...restProps }) => (
  <Legend.Root {...restProps} className={classes.root} />
);
const legendLabelBase = ({ classes, ...restProps }) => (
  <Legend.Label className={classes.label} {...restProps} />
);
const legendItemBase = ({ classes, ...restProps }) => (
  <Legend.Item className={classes.item} {...restProps} />
);
const Root = withStyles(legendStyles, { name: 'LegendRoot' })(legendRootBase);
const Label = withStyles(legendLabelStyles, { name: 'LegendLabel' })(legendLabelBase);
const Item = withStyles(legendItemStyles, { name: 'LegendItem' })(legendItemBase);
const ValueLabel = (props) => {
  const { text } = props;
  return (
    <ValueAxis.Label
      {...props}
      text={`${text}%`}
    />
  );
};
const titleStyles = {
  title: {
    whiteSpace: 'pre',
  },
};
const TitleText = withStyles(titleStyles)(({ classes, ...props }) => (
  <Title.Text {...props} className={classes.title} />
));

 
function App() {
  const classes = useStyles();
  const [type, setType] = useState('cpu');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleChangeType = (event) => {
    setType(event.target.value);
  };

  function loadData(dados){
    let total = 0

    let computers = dados.map(a => a.computer.replace('-', '_'))
    
    const dados_number = []
    const dados_finais = []
    
    for (let i = 0; i < dados.length; i++) {
      const item = dados[i].serie.split(',').map(a => Number(a));

      if (item.length > total)
        total = item.length

      dados_number.push(item)
    }

    for (let i = 0; i < dados_number.length; i++) {
      while(dados_number[i].length < total)
        dados_number[i].push(0)
    }

    for (let i = 0; i < total; i++) {
      dados_finais.push({
        index: i,
      })
    }

    dados_finais.map((obj, idx) => {
      for (let i = 0; i < computers.length; i++) {
        const item = computers[i];
        
        Object.defineProperty(obj, item, {
          value: dados_number[i][idx],
          writable: true,
          enumerable: true,
          configurable: true
        });
    
        Object.defineProperty(obj, 'index', {
          value: idx,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    
      return obj
    })

    console.log(dados_finais)
    setItems(dados_finais)
  }

  useEffect(() => {
    const date = moment(new Date(selectedDate)).format("DD/MM/YYYY")

    axios.get("http://127.0.0.1:5000/monitor", {
      headers: { 'Access-Control-Allow-Origin': '*', 'Accept': 'application/json' },
      params: {
        date, type
      }
    })
    .then(res => {
      const result = res.data.data;
      console.log(result);
      loadData(result)
      setTimeout(() => {}, 3000);
      setLoading(false);
    })
    .catch(err => {
      setLoading(false);
      console.log(err);
    })  

  }, [type, selectedDate])
  
  if (isLoading) {
    return (
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  //
  return (
  
    <>
      <div>
        <FormControl className={classes.formControl}>
          <InputLabel id="demo-simple-select-label">Tipo</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={type}
            onChange={handleChangeType}
          >
            <MenuItem value={'cpu'}>CPU</MenuItem>
            <MenuItem value={'memory'}>Memória</MenuItem>
          </Select> 
        </FormControl>

        <MuiPickersUtilsProvider utils={MomentUtils}>
          <Grid container>
            <KeyboardDatePicker
              disableToolbar
              variant="inline" 
              format="DD/MM/YYYY"
              margin="normal"
              id="date-picker-inline"
              label="Data"
              value={selectedDate}
              onChange={handleDateChange}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
          </Grid>
        </MuiPickersUtilsProvider>
      </div>

      <div>
        <Paper>
          <Chart
            data={items}
            className={classes.chart}
          >
            <ArgumentAxis tickFormat={format} />
            <ValueAxis
              max={50}
              labelComponent={ValueLabel}
            />

            <Plugin name="Bars">

              {items.length > 0 
                ? 
                Object.keys(items[0]).filter(a => a !== 'index').map((item, idx) => {
                  return (
                    <LineSeries
                      key={idx}
                      name={item}
                      valueField={item}
                      argumentField="index"
                    />
                  )
                })
                : 
                null
              }

            </Plugin>
            
            <Legend position="bottom" rootComponent={Root} itemComponent={Item} labelComponent={Label} />
            <Title
              text={`Dados`}
              textComponent={TitleText}
            />
            <Animation />
          </Chart>
        </Paper>
      </div>

    </>
    );
}

export default App;
