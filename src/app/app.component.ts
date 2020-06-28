import { Component, OnInit } from '@angular/core';
import { InstagramService } from './services/instagram.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  tagName = new FormControl('', Validators.required);
  timeDuracao = new FormControl(5);
  timeVerificacao = new FormControl(60);
  tipo = new FormControl('top');

  contador = 0;
  verificacao = false;
  ultimaVeficacao: string;
  verificacaoInterval: any;
  contadorInterval: any;
  slideInterval: any;

  itemActive = 0;

  total = 0;
  listItems: any[] = [];

  constructor(private instagramService: InstagramService) {}

  ngOnInit() {

  }

  buscar() {
    this.pararSlide();
    this.pararVerificao();
    this.search();
  }

  search() {
    if(this.tagName.invalid){
      return;
    }

    this.instagramService.searchTagName(this.tagName.value).subscribe( (resp: any) => {

      this.tipo.value === 'top' ? this.addNewPostInListItems(resp.graphql.hashtag.edge_hashtag_to_top_posts.edges)
                                : this.addNewPostInListItems(resp.graphql.hashtag.edge_hashtag_to_media.edges);


      console.log(resp);

      if(!this.verificacao) {
        this.verificacao = true;
        this.timerVerificacao();
        this.timerContador();
        this.timerSlide();
      } else {
        this.timerContador();
      }

    }, error => {

      if(error.status === 404 ) {
        alert('Tag Não encontrada!!!');
      }

      this.pararVerificao();

    });


  }


  addNewPostInListItems(newList: any[]) {

    if(this.listItems.length === 0) {

      this.listItems = newList;

    } else {

      const firstItem = this.listItems[0];
      const position = newList.indexOf(firstItem);

      // if( position === 0) {

      //   this.listItems.push(newList[position]);

      // } else
      if( position > 0) {

        const partNewList = newList.slice(0, (position) );
        this.listItems = this.listItems.concat(partNewList);

      }

    }

    console.log("New Array");
    console.log(this.listItems);
    this.total = this.listItems.length;

  }


  timerSlide() {

    clearInterval(this.slideInterval);

    this.slideInterval = setInterval( () => {

      if(this.itemActive < (this.total - 1) ) {
        this.itemActive++;
      } else {
        this.itemActive = 0;
      }

      console.log('Slide: ' + this.itemActive)

    }, this.timeDuracao.value * 1000);
  }

  timerContador() {
    this.contador =  this.timeVerificacao.value;

    clearInterval(this.contadorInterval);

    this.contadorInterval = setInterval( () => {

      this.contador -= 1 ;

      if(this.contador <= 0) {
        clearInterval(this.contadorInterval);
      }

    }, 1000);
  }

  timerVerificacao() {
    this.verificacaoInterval = setInterval( () => {

      this.search();

      const dt = new Date();
      this.ultimaVeficacao = dt.getUTCHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();

    }, this.timeVerificacao.value * 1000);
  }

  pararSlide() {
    this.itemActive = 0;
    this.listItems = [];
  }

  pararVerificao() {
    this.verificacao = false;
    clearInterval(this.contadorInterval);
    clearInterval(this.verificacaoInterval);
  }

  prev() {
    this.timerSlide();
    this.itemActive -= this.itemActive > 0 ? 1 : 0 ;
  }

  next() {
    this.timerSlide();
    this.itemActive += this.itemActive < (this.listItems.length - 1) ? 1 : 0 ;
  }


}
