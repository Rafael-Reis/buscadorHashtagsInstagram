import { Component, OnInit,ElementRef,ViewChildren, QueryList } from '@angular/core';
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

  itemActive = 0;
  videoDuracao = 0;

  totalItems = 0;
  listItems: any[] = [];

  contador = 0;
  verificacao = false;
  ultimaVeficacao: string;
  tempoAtualizacao = 0;
  temporizadorSlide: any;
  temporizadorVerificacao: any;
  temporizadorContador: any;

  @ViewChildren('videos', { read: ElementRef }) listVideo: QueryList<ElementRef>;

  constructor(private instagramService: InstagramService) {}

  ngOnInit() {

  }

  buscar() {
    this.itemActive = 0;
    this.listItems = [];

    this.search();

  }

  search() {
    if(this.tagName.invalid){
      return;
    }

    this.instagramService.searchTagName(this.tagName.value).subscribe( (resp: any) => {

      this.tipo.value === 'top' ? this.updateListItems(resp.graphql.hashtag.edge_hashtag_to_top_posts.edges)
                                : this.updateListItems(resp.graphql.hashtag.edge_hashtag_to_media.edges);


      console.log(resp);

      this.startContador();

      if(!this.verificacao) {
        this.verificacao = true;
        this.startSlide();
        this.startVerificacao();
      }

    }, error => {

      if(error.status === 404 ) {
        alert('Tag Não encontrada!!!');
      }

      this.stopVerificacao();

    });


  }


  updateListItems(newList: any[]) {

    if(this.listItems.length === 0) {

      this.listItems = newList;

    } else {

      const firstItem = this.listItems[0];
      const position = newList.indexOf(firstItem);

      if( position > 0) {

        const partNewList = newList.slice(0, (position) );
        this.listItems = this.listItems.concat(partNewList);

      }

    }

    this.listItems.forEach( item => {

      if(item.node.is_video) {

        this.instagramService.getUrlVideo(item.node.shortcode).subscribe( (resp: any) => {
          this.listItems[this.listItems.indexOf(item)].node['video_url'] = resp.graphql.shortcode_media.video_url;
        });

      }

    });

    this.totalItems = this.listItems.length;

    console.log("Update list items: ", this.listItems);

  }


  playVideo(position: number) {

    const videoElement = this.listVideo.toArray()[position];

    if(videoElement === undefined) {
      return;
    }

    this.stopSlide();
    console.log('Pause Slide');

    videoElement.nativeElement.play();
    console.log('Play Video');

    this.videoDuracao = Math.floor(videoElement.nativeElement.duration % 60);
    console.log('Duracao: ' + this.videoDuracao);

    setTimeout( () => {

      this.startSlide();
      console.log('Resume Slide');

    }, this.videoDuracao - this.timeDuracao.value * 1000 );

  }


  startSlide() {

    this.stopSlide();

    this.temporizadorSlide = setInterval( () => {

      if(this.itemActive < (this.totalItems - 1) ) {
        this.itemActive++;
      } else {
        this.itemActive = 0;
      }

      if(this.listItems[this.itemActive] !== undefined) {
        if(this.listItems[this.itemActive].node.is_video) {
          this.playVideo(this.itemActive);
        }
      }

      console.log('Slide Ativo: ', this.itemActive);

    }, this.timeDuracao.value * 1000);
  }

  stopSlide() {
    clearInterval(this.temporizadorSlide);
  }

  startContador() {
    this.contador =  this.timeVerificacao.value;

    this.stopContador();

    this.temporizadorContador = setInterval( () => {

      this.contador -= 1 ;

      if(this.contador <= 0) {
       this.stopContador();
      }

    }, 1000);
  }

  stopContador() {
    clearInterval(this.temporizadorContador);
  }

  startVerificacao() {
    this.temporizadorVerificacao = setInterval( () => {

      this.search();

      const dt = new Date();
      this.ultimaVeficacao = dt.getUTCHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();

    }, this.timeVerificacao.value * 1000);
  }

  stopVerificacao() {
    this.verificacao = false;
    clearInterval(this.temporizadorContador);
    clearInterval(this.temporizadorVerificacao);
  }

  prev() {
    this.startSlide();
    this.itemActive -= this.itemActive > 0 ? 1 : 0 ;
  }

  next() {
    this.startSlide();
    this.itemActive += this.itemActive < (this.listItems.length - 1) ? 1 : 0 ;
  }


}
